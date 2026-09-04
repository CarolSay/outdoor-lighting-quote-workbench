# -*- coding: utf-8 -*-
"""核心业务路由(V5 精简版)：客户/产品/项目/报价(版本+审核)/Provider/历史(筛选)/汇率/导入"""
import json
import re
import urllib.request
from datetime import datetime, timedelta

from db import query_all, query_one, tx, log
from services import quotes as Q
from services.spec_fields import CATALOG_JSON, CORE_KEYS, SPEC_KEYS, parse_description_safe, build_description
import config as C


def _statuses():
    return C.get_statuses()


def _get_exchange():
    try:
        with urllib.request.urlopen('https://open.er-api.com/v6/latest/USD', timeout=8) as resp:
            data = json_loads(resp.read().decode('utf-8'))
        return {'base': 'USD',
                'rates': {k: data.get('rates', {}).get(k) for k in ['CNY', 'AED', 'SAR', 'EUR', 'GBP']},
                'time': data.get('time_last_update_utc')}
    except Exception as e:
        return {'base': 'USD', 'rates': {}, 'error': str(e)}


def json_loads(s):
    return json.loads(s)


def routes():
    return [
        ('GET', r'/api/customers', h_customers),
        ('GET', r'/api/products', h_products),
        ('GET', r'/api/projects', h_projects),
        ('GET', r'/api/quotations', h_quotations),
        ('GET', r'/api/providers', h_providers),
        ('GET', r'/api/quotation-history', h_history),
        ('GET', r'/api/exchange-rates', h_rates),
        ('GET', r'/api/import-files', h_import_files),
        ('GET', r'/api/import-scans', h_import_scans),
        ('GET', r'/api/import-scan-files', h_import_scan_files),
        ('GET', r'/api/quotations/(?P<id>\d+)', h_quotation),
        ('GET', r'/api/quotations/(?P<id>\d+)/excel', h_quotation_excel),
        ('GET', r'/api/quotations/(?P<id>\d+)/versions', h_quotation_versions),
        ('POST', r'/api/providers', h_post_provider),
        ('POST', r'/api/customers', h_post_customer),
        ('POST', r'/api/products', h_post_product),
        ('POST', r'/api/products/parse-description', h_parse_description),
        ('GET', r'/api/product-fields', h_product_fields),
        ('GET', r'/api/project-statuses', h_project_statuses),
        ('POST', r'/api/projects', h_post_project),
        ('POST', r'/api/quotations', h_post_quotation),
        ('POST', r'/api/quotations/(?P<id>\d+)/audit', h_audit_quotation),
        ('POST', r'/api/projects/bulk-status', h_bulk_status),
        ('POST', r'/api/import-scan', h_import_scan),
        ('POST', r'/api/import-confirm', h_import_confirm),
        ('PUT', r'/api/quotations/(?P<id>\d+)', h_put_quotation),
        ('PUT', r'/api/projects/(?P<id>\d+)', h_put_project),
        ('PUT', r'/api/projects/(?P<id>\d+)/status', h_put_project_status),
        ('PUT', r'/api/products/(?P<id>\d+)', h_put_product),
        ('PUT', r'/api/providers/(?P<id>\d+)', h_put_provider),
        ('PUT', r'/api/customers/(?P<id>\d+)', h_put_customer),
        ('DELETE', r'/api/(?P<typ>products|projects|customers)/(?P<id>\d+)', h_delete),
    ]


# ---------------- GET ----------------
def h_customers(p, q, b, http):
    return query_all('SELECT * FROM customers ORDER BY company')


def h_products(p, q, b, http):
    return query_all('SELECT * FROM products ORDER BY active DESC,series,model')


def h_projects(p, q, b, http):
    where, args = [], []
    for key, col in [('customer_id', 'p.customer_id'), ('status', 'p.status'), ('quotation_no', 'p.quotation_no')]:
        if q.get(key):
            where.append('%s=?' % col)
            args.append(q[key])
    sql = 'SELECT p.*,c.company FROM projects p JOIN customers c ON c.id=p.customer_id' \
          + (' WHERE ' + ' AND '.join(where) if where else '') \
          + ' ORDER BY COALESCE(p.modified_at,p.updated_at,p.created_at) DESC'
    return query_all(sql, args)


def h_quotations(p, q, b, http):
    where, args = [], []
    for key, col in [('customer_id', 'q.customer_id'), ('project_id', 'q.project_id'), ('status', 'q.status')]:
        if q.get(key):
            where.append('%s=?' % col)
            args.append(q[key])
    if q.get('quote_no'):
        where.append('q.quote_no LIKE ?')
        args.append('%' + q['quote_no'].strip() + '%')
    if q.get('date_from'):
        where.append('date(q.quote_date)>=date(?)')
        args.append(q['date_from'])
    if q.get('date_to'):
        where.append('date(q.quote_date)<=date(?)')
        args.append(q['date_to'])
    if not q.get('date_from') and not q.get('date_to'):
        df = (datetime.now() - timedelta(days=92)).strftime('%Y-%m-%d')
        where.append('date(q.quote_date)>=date(?)')
        args.append(df)
    if q.get('unexpired', '1') == '1':
        where.append("(q.expiry_date IS NULL OR q.expiry_date='' OR q.expiry_date>=date('now'))")
    sql = 'SELECT q.*,c.company,p.project_name,pr.provider_name FROM quotations q ' \
          'JOIN customers c ON c.id=q.customer_id LEFT JOIN projects p ON p.id=q.project_id ' \
          'LEFT JOIN providers pr ON pr.id=q.provider_id' \
          + (' WHERE ' + ' AND '.join(where) if where else '') \
          + ' ORDER BY date(q.quote_date) DESC,q.updated_at DESC'
    return query_all(sql, args)


def h_providers(p, q, b, http):
    return query_all('SELECT * FROM providers WHERE active=1 ORDER BY provider_name')


def h_history(p, q, b, http):
    """报价历史：支持 报价号/客户名称/项目名称/产品名称(含描述)/状态/日期区间 筛选(需求4)。"""
    where, args = [], []
    if q.get('quote_no'):
        where.append('h.quote_no LIKE ?')
        args.append('%' + q['quote_no'].strip() + '%')
    if q.get('customer'):
        where.append('c.company LIKE ?')
        args.append('%' + q['customer'].strip() + '%')
    if q.get('project'):
        where.append("p.project_name LIKE ?")
        args.append('%' + q['project'].strip() + '%')
    if q.get('product'):
        # 多关键词空格分隔，AND 组合；同时匹配明细的商品名称与商品描述
        for kw in [t for t in re.split(r'\s+', q['product'].strip()) if t]:
            like = '%' + kw.lower() + '%'
            where.append("EXISTS (SELECT 1 FROM quotation_items qi WHERE qi.quotation_id=h.quotation_id "
                         "AND (lower(COALESCE(qi.product_name,'')) LIKE ? OR lower(COALESCE(qi.description,'')) LIKE ?))")
            args += [like, like]
    if q.get('status'):
        where.append('h.status=?')
        args.append(q['status'])
    if q.get('date_from'):
        where.append('date(h.quote_date)>=date(?)')
        args.append(q['date_from'])
    if q.get('date_to'):
        where.append('date(h.quote_date)<=date(?)')
        args.append(q['date_to'])
    sql = 'SELECT h.*,c.company,p.project_name FROM quotation_history h ' \
          'JOIN customers c ON c.id=h.customer_id LEFT JOIN projects p ON p.id=h.project_id' \
          + (' WHERE ' + ' AND '.join(where) if where else '') \
          + ' ORDER BY h.created_at DESC,h.id DESC'
    return query_all(sql, args)


def h_rates(p, q, b, http):
    return _get_exchange()


def h_import_files(p, q, b, http):
    return Q.import_list()


def h_import_scans(p, q, b, http):
    return query_all('SELECT * FROM import_scans ORDER BY created_at DESC LIMIT 50')


def h_import_scan_files(p, q, b, http):
    sid = int(q.get('scan_id', '0'))
    return query_all('SELECT id,scan_id,file_name,relative_path,file_ext,file_size,sha256,status,message,'
                     'doc_type,quote_no,quote_date,customer_text,customer_contact,customer_address,'
                     'customer_phone,project_name,row_count FROM import_scan_files '
                     'WHERE scan_id=? ORDER BY id', (sid,))


def h_quotation(p, q, b, http):
    i = int(p['id'])
    row = query_one('SELECT q.*,c.company,p.project_name,pr.provider_name FROM quotations q '
                    'JOIN customers c ON c.id=q.customer_id LEFT JOIN projects p ON p.id=q.project_id '
                    'LEFT JOIN providers pr ON pr.id=q.provider_id WHERE q.id=?', (i,))
    if not row:
        return http.send_json({'error': '报价不存在'}, 404)
    row['items'] = query_all('SELECT * FROM quotation_items WHERE quotation_id=? ORDER BY item_no', (i,))
    return row


def h_quotation_versions(p, q, b, http):
    """版本历史(需求1/6)：每次保存/审核一条，changes 为字段级变更。"""
    i = int(p['id'])
    if not query_one('SELECT id FROM quotations WHERE id=?', (i,)):
        return http.send_json({'error': '报价不存在'}, 404)
    rows = query_all('SELECT id,version_no,action,changes,created_at FROM quotation_versions '
                     'WHERE quotation_id=? ORDER BY version_no DESC', (i,))
    for r in rows:
        try:
            r['changes'] = json.loads(r.get('changes') or '[]')
        except Exception:
            r['changes'] = []
    return rows


def h_quotation_excel(p, q, b, http):
    """导出 Excel：任何状态均可导出当前内容，不修改状态、不写历史(需求1)。"""
    i = int(p['id'])
    mode = q.get('mode', 'auto')
    path = Q.imported_original(i) if mode in ('auto', 'original') else None
    path = path or Q.excel_file(i)
    if not path:
        return http.send_json({'error': '报价不存在或生成失败'}, 404)
    return http.send_file(path)


# ---------------- POST ----------------
def h_post_provider(p, q, b, http):
    i = tx(lambda c: c.execute('INSERT INTO providers(provider_code,provider_name,provider_info,active) '
                               'VALUES (?,?,?,1)',
                               (b.get('provider_code'), b.get('provider_name'), b.get('provider_info', ''))))
    log('provider', i, 'create', b.get('provider_name', ''))
    return query_one('SELECT * FROM providers WHERE id=?', (i,))


def _gen_code(prefix):
    return '%s-%s' % (prefix, datetime.now().strftime('%Y%m%d%H%M%S%f')[-10:])


def h_post_customer(p, q, b, http):
    if not str(b.get('company') or '').strip():
        return http.send_json({'error': '请填写公司名称'}, 400)
    if not str(b.get('customer_code') or '').strip():
        b['customer_code'] = _gen_code('C')
    elif query_one('SELECT id FROM customers WHERE customer_code=?', (b['customer_code'],)):
        return http.send_json({'error': '客户编码已存在：%s' % b['customer_code']}, 400)
    ks = ['customer_code', 'company', 'country', 'city', 'customer_type', 'contact', 'email', 'whatsapp_phone',
          'currency', 'incoterm', 'payment_terms', 'validity_days', 'customer_grade', 'default_discount_pct',
          'notes', 'active']
    i = tx(lambda c: c.execute('INSERT INTO customers(' + ','.join(ks) + ') VALUES (' + ','.join('?' * len(ks)) + ')',
                               [b.get(k) for k in ks]))
    log('customer', i, 'create', b.get('company', ''))
    return query_one('SELECT * FROM customers WHERE id=?', (i,))


# 产品字段：九类体系。核心列直接存 products 固定列，扩展字段由 body.spec 收集进 spec_json；
# 除 id/时间/active 外全部参与重复判定；product_code 由系统自动生成，不参与判定(设计说明 §6)
PRODUCT_FIELDS = ['series', 'model', 'product_name', 'description', 'power', 'voltage', 'cct_color',
                  'control', 'ip_rating', 'beam_angle', 'length_size', 'led_count', 'pixel_count', 'led_chip',
                  'material', 'cct', 'category', 'body_color', 'hs_code', 'currency', 'moq', 'trade_terms',
                  'lifespan', 'working_temperature', 'storage_temperature', 'weight', 'brightness',
                  'data_cable', 'controller', 'notes', 'cost_usd', 'standard_price_usd', 'source_page']
PRODUCT_CODE = 'product_code'


def _norm_product(b):
    """规范化：字符串去首尾空白，空串→None。"""
    out = {}
    for k in [PRODUCT_CODE] + PRODUCT_FIELDS:
        v = b.get(k)
        if isinstance(v, str):
            v = v.strip()
            if v == '':
                v = None
        out[k] = v
    return out


def _spec_of(b):
    """收集扩展字段：body.spec dict 优先，其次 body 顶层扩展 key。
    整体提交(spec dict 存在)时空值=显式清空，也返回，避免旧值复活。"""
    src = b.get('spec') if isinstance(b.get('spec'), dict) else None
    whole = src is not None
    out = {}
    for k in SPEC_KEYS:
        if src is not None and k in src:
            v = src[k]
        elif src is None and k in b:
            v = b[k]
        else:
            continue
        if isinstance(v, str):
            v = v.strip()
        if v != '':
            out[k] = v
        elif whole:
            out[k] = ''
    return out


def _clean_spec(spec):
    return {k: v for k, v in (spec or {}).items() if v not in ('', None)}


def _merge_notes(a, b_):
    """合并备注：按行去重，保留全部信息。"""
    lines, seen = [], set()
    for part in (a, b_):
        for ln in str(part or '').split('\n'):
            ln = ln.strip()
            if ln and ln.lower() not in seen:
                seen.add(ln.lower())
                lines.append(ln)
    return '\n'.join(lines)


def _rebuild_desc(d, spec, old=None):
    """合并字段并重建描述（编辑保存后自动执行）：
    合并优先级 提交值 > 描述解析补空 > 旧值；备注 = 解析剩余文本 + 提交/旧备注（去重）。
    返回 (description, notes)。"""
    merged = {}
    if old:
        for k in CORE_KEYS:
            v = old.get(k)
            if v not in (None, ''):
                merged[k] = v
    merged.update(spec)
    parsed = parse_description_safe(d.get('description') or '') if d.get('description') else {}
    for k in CORE_KEYS:
        v = d.get(k)
        if v in (None, ''):
            v = parsed.get(k)
        if v not in (None, ''):
            merged[k] = v
    notes = _merge_notes(parsed.get('notes'), d.get('notes') or (old.get('notes') if old else ''))
    if notes:
        merged['notes'] = notes
    desc = build_description(merged)
    return (desc or d.get('description') or ''), notes


def h_product_fields(p, q, b, http):
    """九类字段目录（前端产品表单动态渲染用）。"""
    return CATALOG_JSON


def h_project_statuses(p, q, b, http):
    """项目状态列表（从 config 表读取，前端下拉用）。"""
    return _statuses()


def h_parse_description(p, q, b, http):
    """从描述解析结构化字段（产品表单"从描述解析"按钮用），只解析不保存。"""
    desc = str(b.get('description') or '')
    f = parse_description_safe(desc)
    return {'fields': f, 'description_preview': build_description(f)}


def h_post_product(p, q, b, http):
    d = _norm_product(b)
    if not d.get('series'):
        return http.send_json({'error': '请填写系列(series)'}, 400)
    if not d.get('product_code'):
        d['product_code'] = _gen_code('CM-P')
    elif query_one('SELECT id FROM products WHERE product_code=?', (d['product_code'],)):
        return http.send_json({'error': '产品编码已存在：%s' % d['product_code']}, 400)
    spec = _spec_of(b)
    desc, notes = _rebuild_desc(d, spec)
    d['description'], d['notes'] = (desc or None), (notes or None)
    conds = ' AND '.join(k + ' IS ?' for k in PRODUCT_FIELDS)
    dup = query_one('SELECT id,product_code FROM products WHERE active=1 AND ' + conds,
                    [d.get(k) for k in PRODUCT_FIELDS])
    if dup:
        return http.send_json({'error': '不能重复添加：已存在参数完全一致的产品（商品编码 %s，ID %s）。'
                                        '如需调整请直接编辑该产品。' % (dup['product_code'] or '-', dup['id'])}, 400)
    ks = [PRODUCT_CODE] + PRODUCT_FIELDS + ['spec_json', 'active']
    spec_json = json.dumps(_clean_spec(spec), ensure_ascii=False) if _clean_spec(spec) else None
    i = tx(lambda c: c.execute('INSERT INTO products(' + ','.join(ks) + ') VALUES (' + ','.join('?' * len(ks)) + ')',
                               [d.get(k) for k in ks[:-2]] + [spec_json, b.get('active', 1)]))
    log('product', i, 'create', d.get('product_code') or '')
    return query_one('SELECT * FROM products WHERE id=?', (i,))


def h_post_project(p, q, b, http):
    if not str(b.get('project_name') or '').strip():
        return http.send_json({'error': '请填写项目名称'}, 400)
    if not b.get('customer_id'):
        return http.send_json({'error': '请选择客户'}, 400)
    if not str(b.get('project_code') or '').strip():
        b['project_code'] = _gen_code('PRJ')
    elif query_one('SELECT id FROM projects WHERE project_code=?', (b['project_code'],)):
        return http.send_json({'error': '项目编码已存在：%s' % b['project_code']}, 400)
    ks = ['project_code', 'customer_id', 'project_name', 'project_type', 'status', 'estimated_value_usd',
          'quotation_no', 'competitor', 'next_action', 'next_followup', 'probability_pct', 'owner', 'notes']
    vals = [b.get(k) for k in ks]
    if not vals[4]:
        vals[4] = '报价中'

    def f(c):
        cur = c.execute('INSERT INTO projects(' + ','.join(ks) + ') VALUES (' + ','.join('?' * len(ks)) + ')', vals)
        c.execute('UPDATE projects SET modified_at=CURRENT_TIMESTAMP WHERE id=?', (cur.lastrowid,))
        return cur.lastrowid
    i = tx(f)
    log('project', i, 'create', b.get('project_name', ''))
    return query_one('SELECT * FROM projects WHERE id=?', (i,))


# ---------------- 报价单：保存 / 版本 / 审核 ----------------
QUOTE_HEADER_FIELDS = [
    ('quote_no', '报价编号'), ('quote_date', '报价日期'), ('customer_id', '客户'),
    ('project_id', '项目'), ('provider_id', 'Provider'), ('currency', '币种'),
    ('incoterm', '贸易条款'), ('payment_terms', '付款条款'), ('validity_days', '有效期(天)'),
    ('notes', '备注'),
]
QUOTE_ITEM_FIELDS = [
    ('product_name', '商品名称'), ('description', '商品描述'), ('qty', '数量'),
    ('unit', '单位'), ('unit_price_usd', '单价USD'), ('our_price_usd', '内部参考价'),
]


def _fmt(v):
    """显示值：数值去掉多余 0，空→''。"""
    if v is None:
        return ''
    if isinstance(v, float):
        return ('%g' % v)
    s = str(v).strip()
    try:
        f = float(s)
        return '%g' % f
    except Exception:
        return s


def _ref_name(c, table, col, rid):
    if rid in (None, ''):
        return ''
    r = c.execute('SELECT %s AS v FROM %s WHERE id=?' % (col, table), (rid,)).fetchone()
    return (r['v'] or '') if r else str(rid)


def _disp(header_val, new_val, c, field):
    """字段的显示值：id 类字段解析为名称。"""
    if field == 'customer_id':
        return _ref_name(c, 'customers', 'company', new_val)
    if field == 'project_id':
        return _ref_name(c, 'projects', 'project_name', new_val)
    if field == 'provider_id':
        return _ref_name(c, 'providers', 'provider_name', new_val)
    return _fmt(new_val)


def _item_brief(x):
    return ('%s %s' % (x.get('product_name') or '', x.get('description') or '')).strip()[:60]


def _diff_changes(old, body, c):
    """字段级 diff(需求6)：只记录变化的字段。old 为旧快照 dict(含 items)，body 为新提交数据。"""
    changes = []
    for key, label in QUOTE_HEADER_FIELDS:
        o = _disp(key, old.get(key), c, key)
        n = _disp(key, body.get(key), c, key)
        if o != n:
            changes.append({'label': label, 'old': o, 'new': n})
    oi, ni = old.get('items') or [], body.get('items') or []
    for idx in range(max(len(oi), len(ni))):
        o = oi[idx] if idx < len(oi) else None
        w = ni[idx] if idx < len(ni) else None
        if o and not w:
            changes.append({'item': idx + 1, 'label': '删除明细', 'old': _item_brief(o), 'new': ''})
            continue
        if w and not o:
            changes.append({'item': idx + 1, 'label': '新增明细', 'old': '', 'new': _item_brief(w)})
            continue
        for f, label in QUOTE_ITEM_FIELDS:
            ov, nv = _fmt(o.get(f)), _fmt(w.get(f))
            if ov != nv:
                changes.append({'item': idx + 1, 'label': label, 'old': ov, 'new': nv})
    return changes


def _quote_snapshot(qid, row=None):
    row = row or query_one('SELECT * FROM quotations WHERE id=?', (qid,))
    if not row:
        return None
    snap = {k: row[k] for k, _ in QUOTE_HEADER_FIELDS}
    snap['status'] = row['status']
    snap['total_usd'] = row['total_usd']
    snap['expiry_date'] = row['expiry_date']
    snap['items'] = query_all('SELECT * FROM quotation_items WHERE quotation_id=? ORDER BY item_no', (qid,))
    return snap


def _body_snapshot(d, total, expiry):
    snap = {k: d.get(k) for k, _ in QUOTE_HEADER_FIELDS}
    snap.update({'status': d.get('status') or '报价草稿', 'total_usd': total, 'expiry_date': expiry,
                 'items': d.get('items') or []})
    return snap


def _save_quotation(c, d, qid=None):
    """写入报价单主表+明细（不含版本/历史，版本在路由层记录）。"""
    if not d.get('quote_date'):
        d['quote_date'] = datetime.now().strftime('%Y-%m-%d')
    try:
        d['expiry_date'] = (datetime.strptime(str(d['quote_date'])[:10], '%Y-%m-%d')
                            + timedelta(days=int(d.get('validity_days') or 30))).strftime('%Y-%m-%d')
    except Exception:
        d['expiry_date'] = ''
    d['total_usd'] = sum(float(x.get('qty') or 0) * float(x.get('unit_price_usd') or 0) for x in d.get('items', []))
    d['status'] = d.get('status') or '报价草稿'
    if qid is None:
        ks = ['quote_no', 'quote_date', 'customer_id', 'project_id', 'provider_id', 'expiry_date', 'currency',
              'incoterm', 'payment_terms', 'validity_days', 'status', 'total_usd', 'notes', 'is_formal']
        qid = c.execute('INSERT INTO quotations(' + ','.join(ks) + ') VALUES (' + ','.join('?' * len(ks)) + ')',
                        [d.get(k) for k in ks]).lastrowid
    else:
        # 需求1：审核后再次修改 → 自动退回报价草稿，需重新审核
        c.execute('UPDATE quotations SET quote_no=?,quote_date=?,customer_id=?,project_id=?,provider_id=?,'
                  'expiry_date=?,currency=?,incoterm=?,payment_terms=?,validity_days=?,status=?,total_usd=?,'
                  'notes=?,is_formal=0,reviewed_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?',
                  (d.get('quote_no'), d['quote_date'], d.get('customer_id') or None,
                   d.get('project_id') or None, d.get('provider_id') or None, d['expiry_date'],
                   d.get('currency', 'USD'), d.get('incoterm', 'EXW'), d.get('payment_terms', ''),
                   d.get('validity_days'), '报价草稿', d['total_usd'], d.get('notes', ''), qid))
        c.execute('DELETE FROM quotation_items WHERE quotation_id=?', (qid,))
    for n, x in enumerate(d.get('items', []), 1):
        qty = float(x.get('qty') or 0)
        price = float(x.get('unit_price_usd') or 0)
        our = x.get('our_price_usd')
        our_amt = qty * float(our) if our not in ('', None) else None
        c.execute('INSERT INTO quotation_items(quotation_id,item_no,product_id,product_name,description,qty,unit,'
                  'unit_price_usd,amount_usd,our_price_usd,our_amount_usd) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                  (qid, n, x.get('product_id') or None, x.get('product_name', ''), x.get('description', ''), qty,
                   x.get('unit', 'pcs'), price, qty * price, our, our_amt))
    return qid


def _insert_version(c, qid, action, changes, snap):
    vno = c.execute('SELECT COALESCE(MAX(version_no),0)+1 FROM quotation_versions WHERE quotation_id=?',
                    (qid,)).fetchone()[0]
    c.execute('INSERT INTO quotation_versions(quotation_id,version_no,action,changes,snapshot) '
              'VALUES (?,?,?,?,?)',
              (qid, vno, action, json.dumps(changes, ensure_ascii=False), json.dumps(snap, ensure_ascii=False)))
    return vno


def h_post_quotation(p, q, b, http):
    if not str(b.get('quote_no') or '').strip():
        return http.send_json({'error': '请填写报价编号'}, 400)
    if not b.get('customer_id'):
        return http.send_json({'error': '请选择客户'}, 400)
    if query_one('SELECT id FROM quotations WHERE quote_no=?', (b['quote_no'],)):
        return http.send_json({'error': '报价编号已存在：%s' % b['quote_no']}, 400)
    b['status'] = '报价草稿'

    def f(c):
        qid = _save_quotation(c, b)
        _insert_version(c, qid, 'create', [], _body_snapshot(b, b['total_usd'], b.get('expiry_date', '')))
        return qid
    qid = tx(f)
    log('quotation', qid, 'create v1', '%s（%d 条明细，$%s）'
        % (b.get('quote_no', ''), len(b.get('items') or []), _fmt(b.get('total_usd'))))
    return {'id': qid, 'version': 1, 'status': '报价草稿'}


def h_put_quotation(p, q, b, http):
    i = int(p['id'])
    old = query_one('SELECT * FROM quotations WHERE id=?', (i,))
    if not old:
        return http.send_json({'error': '报价不存在'}, 404)
    old_snap = _quote_snapshot(i, old)
    b['quote_date'] = b.get('quote_date') or old['quote_date']
    b['status'] = '报价草稿'
    was_formal = old['status'] == '正式版本'

    def f(c):
        _save_quotation(c, b, qid=i)
        changes = _diff_changes(old_snap, b, c)
        vno = _insert_version(c, i, 'update', changes, _body_snapshot(b, b['total_usd'], b.get('expiry_date', '')))
        return changes, vno
    changes, vno = tx(f)
    detail = '; '.join('%s: %s → %s' % (x['label'], x.get('old', ''), x.get('new', '')) for x in changes)[:500] \
        or '无字段变更'
    log('quotation', i, 'update v%d%s' % (vno, '（正式版退回草稿）' if was_formal else ''), detail)
    return {'id': i, 'version': vno, 'changed': len(changes), 'changes': changes,
            'status': '报价草稿', 'reverted': was_formal}


def h_audit_quotation(p, q, b, http):
    """需求1：审核按钮 → 状态才是正式版；quotation_history 按 quotation_id upsert。"""
    i = int(p['id'])
    row = query_one('SELECT * FROM quotations WHERE id=?', (i,))
    if not row:
        return http.send_json({'error': '报价不存在'}, 404)
    if row['status'] == '正式版本':
        return http.send_json({'error': '该报价单已是正式版本'}, 400)

    def f(c):
        c.execute("UPDATE quotations SET status='正式版本',is_formal=1,reviewed_at=CURRENT_TIMESTAMP,"
                  'updated_at=CURRENT_TIMESTAMP WHERE id=?', (i,))
        q = c.execute('SELECT * FROM quotations WHERE id=?', (i,)).fetchone()
        ex = c.execute('SELECT id FROM quotation_history WHERE quotation_id=?', (i,)).fetchone()
        vals = (q['quote_no'], q['quote_date'], q['customer_id'], q['project_id'], q['provider_id'],
                q['expiry_date'], q['currency'], q['total_usd'], '正式版本', q['notes'])
        if ex:
            c.execute('UPDATE quotation_history SET quote_no=?,quote_date=?,customer_id=?,project_id=?,provider_id=?,'
                      'expiry_date=?,currency=?,total_usd=?,status=?,notes=?,created_at=CURRENT_TIMESTAMP '
                      'WHERE id=?', vals + (ex['id'],))
        else:
            c.execute('INSERT INTO quotation_history(quotation_id,quote_no,quote_date,customer_id,project_id,'
                      'provider_id,expiry_date,currency,total_usd,status,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                      (i,) + vals)
        vno = _insert_version(c, i, 'audit',
                              [{'label': '状态', 'old': '报价草稿', 'new': '正式版本'}],
                              _quote_snapshot(i, q))
        return vno
    vno = tx(f)
    log('quotation', i, 'audit', '%s 审核为正式版本' % row['quote_no'])
    return {'ok': True, 'id': i, 'version': vno, 'status': '正式版本',
            'reviewed_at': query_one('SELECT reviewed_at FROM quotations WHERE id=?', (i,))['reviewed_at']}


def h_bulk_status(p, q, b, http):
    ids = [int(x) for x in b.get('ids', [])]
    status = b.get('status')
    if status not in _statuses():
        return http.send_json({'error': '无效项目状态'}, 400)

    def f(c):
        for i in ids:
            c.execute('UPDATE projects SET status=?,modified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP '
                      'WHERE id=?', (status, i))
    tx(f)
    for i in ids:
        log('project', i, 'status_change', status)
    return {'ok': True, 'count': len(ids)}


def h_import_scan(p, q, b, http):
    root = b.get('root_name', '本地文件夹')
    scanid = tx(lambda c: c.execute('INSERT INTO import_scans(root_name,status) VALUES (?,?)',
                                    (root, '待确认')))
    results = Q.scan_files(scanid, b.get('files', []))
    log('import_scan', scanid, 'scan', '扫描 %d 个文件' % len(results))
    return {'scan_id': scanid, 'files': results}


def h_import_confirm(p, q, b, http):
    res = Q.confirm_import([int(x) for x in b.get('ids', [])])
    return res


# ---------------- PUT / DELETE ----------------
def h_put_project(p, q, b, http):
    i = int(p['id'])
    ks = ['project_code', 'customer_id', 'project_name', 'project_type', 'status', 'estimated_value_usd',
          'quotation_no', 'competitor', 'next_action', 'next_followup', 'probability_pct', 'owner', 'notes']
    if not str(b.get('project_name') or '').strip():
        return http.send_json({'error': '请填写项目名称'}, 400)
    tx(lambda c: c.execute('UPDATE projects SET ' + ','.join(k + '=?' for k in ks)
                           + ',updated_at=CURRENT_TIMESTAMP,modified_at=CURRENT_TIMESTAMP WHERE id=?',
                           [b.get(k) for k in ks] + [i]))
    log('project', i, 'update', b.get('project_name', ''))
    return query_one('SELECT * FROM projects WHERE id=?', (i,))


def h_put_project_status(p, q, b, http):
    i = int(p['id'])
    status = b.get('status')
    if status not in _statuses():
        return http.send_json({'error': '无效项目状态'}, 400)
    tx(lambda c: c.execute('UPDATE projects SET status=?,updated_at=CURRENT_TIMESTAMP,modified_at=CURRENT_TIMESTAMP '
                           'WHERE id=?', (status, i)))
    log('project', i, 'status_change', status)
    return {'ok': True}


def h_put_product(p, q, b, http):
    i = int(p['id'])
    old = query_one('SELECT * FROM products WHERE id=?', (i,))
    if not old:
        return http.send_json({'error': '产品不存在'}, 404)
    old = dict(old)
    d = _norm_product(b)
    # 未提交(key 缺失)的核心字段沿用旧值；显式传空串视为清空
    for k in PRODUCT_FIELDS:
        if k not in b or b.get(k) is None:
            if old.get(k) is not None:
                d[k] = old[k]
    if not d.get('series'):
        return http.send_json({'error': '请填写系列(series)'}, 400)
    if not d.get('product_code'):
        d['product_code'] = old['product_code']   # 未提供则保留原编码
    if d.get('product_code'):
        dupc = query_one('SELECT id FROM products WHERE product_code=? AND id<>?', (d['product_code'], i))
        if dupc:
            return http.send_json({'error': '产品编码已存在：%s' % d['product_code']}, 400)
    spec = _spec_of(b)
    # 旧扩展字段兜底合并：提交里未出现的 key 沿用旧值；提交空串=显式清空(setdefault 不覆盖)
    try:
        old_spec = json.loads(old.get('spec_json') or '{}')
    except Exception:
        old_spec = {}
    for k, v in (old_spec if isinstance(old_spec, dict) else {}).items():
        spec.setdefault(k, v)
    desc, notes = _rebuild_desc(d, spec, old)
    d['description'], d['notes'] = (desc or None), (notes or None)
    ks = [PRODUCT_CODE] + PRODUCT_FIELDS
    spec_json = json.dumps(_clean_spec(spec), ensure_ascii=False) if _clean_spec(spec) else None
    tx(lambda c: c.execute('UPDATE products SET ' + ','.join(k + '=?' for k in ks)
                           + ',spec_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
                           [d.get(k) for k in ks] + [spec_json, i]))
    log('product', i, 'update', d.get('product_code') or '')
    return query_one('SELECT * FROM products WHERE id=?', (i,))


def h_put_provider(p, q, b, http):
    i = int(p['id'])
    ks = ['provider_code', 'provider_name', 'provider_info', 'active']
    tx(lambda c: c.execute('UPDATE providers SET ' + ','.join(k + '=?' for k in ks)
                           + ',updated_at=CURRENT_TIMESTAMP WHERE id=?', [b.get(k) for k in ks] + [i]))
    log('provider', i, 'update', b.get('provider_name', ''))
    return query_one('SELECT * FROM providers WHERE id=?', (i,))


def h_put_customer(p, q, b, http):
    i = int(p['id'])
    if not str(b.get('company') or '').strip():
        return http.send_json({'error': '请填写公司名称'}, 400)
    if str(b.get('customer_code') or '').strip():
        dupc = query_one('SELECT id FROM customers WHERE customer_code=? AND id<>?', (b['customer_code'], i))
        if dupc:
            return http.send_json({'error': '客户编码已存在：%s' % b['customer_code']}, 400)
    ks = ['customer_code', 'company', 'country', 'city', 'customer_type', 'contact', 'email', 'whatsapp_phone',
          'currency', 'incoterm', 'payment_terms', 'validity_days', 'customer_grade', 'default_discount_pct',
          'notes', 'active']
    tx(lambda c: c.execute('UPDATE customers SET ' + ','.join(k + '=?' for k in ks)
                           + ',updated_at=CURRENT_TIMESTAMP WHERE id=?', [b.get(k) for k in ks] + [i]))
    log('customer', i, 'update', b.get('company', ''))
    return query_one('SELECT * FROM customers WHERE id=?', (i,))


def h_delete(p, q, b, http):
    typ, i = p['typ'], int(p['id'])
    try:
        if typ == 'projects':
            tx(lambda c: c.execute("UPDATE projects SET status='项目终止',modified_at=CURRENT_TIMESTAMP,"
                                   "updated_at=CURRENT_TIMESTAMP WHERE id=?", (i,)))
        else:
            tx(lambda c: c.execute('UPDATE %s SET active=0,updated_at=CURRENT_TIMESTAMP WHERE id=?' % typ, (i,)))
        log('project' if typ == 'projects' else typ[:-1], i, 'soft_delete', '')
        return {'ok': True}
    except Exception as e:
        return http.send_json({'error': str(e)}, 500)
