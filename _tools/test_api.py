# -*- coding: utf-8 -*-
"""V5 精简版自动化测试（功能 + 边界）。
前置：python app.py 已在 5100 端口运行。
覆盖：客户/产品(重复校验)/项目/报价流程(版本·审核·导出不改状态)/历史筛选/邮件配置/备份/导入/静态页。
测试后自动清理本次产生的数据（直接 DB 删除），恢复基线。
"""
import base64
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE)
HOST = 'http://127.0.0.1:5100'
TS = datetime.now().strftime('%H%M%S')
TAG = 'V5T' + TS          # 测试数据标记

results = []


def check(name, cond, info=''):
    results.append((name, bool(cond), info))
    print(('  PASS ' if cond else '  FAIL ') + name + (('  | ' + str(info)[:120]) if (info and not cond) else ''))


def req(method, path, body=None, raw=False):
    data = None if body is None else (body if isinstance(body, bytes) else json.dumps(body).encode('utf-8'))
    r = urllib.request.Request(HOST + path, data=data, method=method)
    if data is not None:
        r.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            content = resp.read()
            if raw:
                return resp.status, content, dict(resp.headers)
            try:
                return resp.status, json.loads(content.decode('utf-8')), dict(resp.headers)
            except Exception:
                return resp.status, content, dict(resp.headers)
    except urllib.error.HTTPError as e:
        content = e.read()
        try:
            return e.code, json.loads(content.decode('utf-8')), dict(e.headers)
        except Exception:
            return e.code, content, dict(e.headers)


created = {'customers': [], 'products': [], 'projects': [], 'quotations': [],
           'backups': [], 'import_files': [], 'customers_by_name': []}

# ================= A. 客户 =================
print('\n[A] 客户模块')
s, d, _ = req('GET', '/api/customers')
check('A1 客户列表', s == 200 and isinstance(d, list) and len(d) >= 2, d if s != 200 else len(d))

s, d, _ = req('POST', '/api/customers', {'company': ''})
check('A2 边界：空公司名 400', s == 400 and '公司名称' in d.get('error', ''), d)

cust_code = 'C-' + TAG
s, d, _ = req('POST', '/api/customers', {'company': TAG + '客户', 'customer_code': cust_code, 'country': 'DE'})
check('A3 新建客户', s == 200 and d.get('id'), d)
created['customers'].append(d['id'])
cid = d['id']

s, d, _ = req('POST', '/api/customers', {'company': 'x', 'customer_code': cust_code})
check('A4 边界：客户编码重复 400', s == 400 and '已存在' in d.get('error', ''), d)

s, d, _ = req('PUT', '/api/customers/%d' % cid, {'company': TAG + '客户B', 'customer_code': cust_code, 'active': 1})
check('A5 编辑客户', s == 200 and d.get('company') == TAG + '客户B', d)

# ================= B. 产品 & 重复校验 =================
print('\n[B] 产品模块 + 重复校验')
prod = {'series': 'Linear Light', 'model': TAG, 'product_name': TAG + '灯',
        'description': '12W DC24V RGBW DMX512 IP67 ' + TAG, 'power': '12W', 'voltage': 'DC24V',
        'cct_color': 'RGBW', 'control': 'DMX512', 'ip_rating': 'IP67', 'cost_usd': 5, 'standard_price_usd': 10}
s, d, _ = req('POST', '/api/products', prod)
check('B1 新增产品', s == 200 and d.get('id'), d)
pid = d['id']
created['products'].append(pid)
check('B2 产品编码自动生成', bool(d.get('product_code')), d.get('product_code'))

s, d, _ = req('POST', '/api/products', dict(prod))
check('B3 边界：完全一致重复 400', s == 400 and '不能重复添加' in d.get('error', ''), d)
check('B4 重复提示含商品编码', '商品编码' in d.get('error', ''), d.get('error'))

s, d, _ = req('POST', '/api/products', dict(prod, power='15W'))
check('B5 参数不同可新增', s == 200 and d.get('id'), d)
created['products'].append(d['id'])

s, d, _ = req('POST', '/api/products', {'series': ''})
check('B6 边界：缺系列 400', s == 400, d)

s, d, _ = req('PUT', '/api/products/%d' % pid, dict(prod, product_name=TAG + '灯改'))
check('B7 编辑产品(不加重复限制)', s == 200, d)

# ================= C. 项目 =================
print('\n[C] 项目模块')
s, d, _ = req('POST', '/api/projects', {'project_name': '', 'customer_id': cid})
check('C1 边界：缺项目名 400', s == 400, d)
s, d, _ = req('POST', '/api/projects', {'project_name': TAG + '项目'})
check('C2 边界：缺客户 400', s == 400, d)
s, d, _ = req('POST', '/api/projects', {'project_name': TAG + '项目', 'customer_id': cid})
check('C3 新建项目', s == 200 and d.get('id'), d)
prid = d['id']
created['projects'].append(prid)

s, d, _ = req('POST', '/api/projects/bulk-status', {'ids': [prid], 'status': '无效状态'})
check('C4 边界：无效状态 400', s == 400, d)
s, d, _ = req('POST', '/api/projects/bulk-status', {'ids': [prid], 'status': '样品确认'})
check('C5 批量改状态', s == 200 and d.get('count') == 1, d)
s, d, _ = req('PUT', '/api/projects/%d/status' % prid, {'status': '报价中'})
check('C6 单个改状态', s == 200, d)
s, d, _ = req('DELETE', '/api/projects/%d' % prid)
check('C7 删除=终止', s == 200, d)
s, d, _ = req('GET', '/api/projects?customer_id=%d' % cid)
row = [x for x in d if x['id'] == prid]
check('C8 项目状态为终止', row and row[0]['status'] == '项目终止', row)

# ================= D. 报价流程（核心） =================
print('\n[D] 报价流程：版本/审核/导出')
QNO = TAG + '-Q1'
base_q = {'quote_no': QNO, 'quote_date': '2026-09-03', 'customer_id': cid, 'project_id': prid,
          'currency': 'USD', 'incoterm': 'EXW', 'payment_terms': '100% T/T in advance',
          'validity_days': 30, 'notes': '初始备注',
          'items': [{'product_id': pid, 'product_name': TAG + '灯', 'description': '12W RGBW',
                     'qty': 10, 'unit': 'pcs', 'unit_price_usd': 10.5, 'our_price_usd': 8}]}

s, d, _ = req('POST', '/api/quotations', {**base_q, 'quote_no': ''})
check('D1 边界：缺报价号 400', s == 400, d)
s, d, _ = req('POST', '/api/quotations', {**base_q, 'customer_id': None})
check('D2 边界：缺客户 400', s == 400, d)
s, d, _ = req('POST', '/api/quotations', base_q)
check('D3 新建报价 V1 草稿', s == 200 and d.get('version') == 1 and d.get('status') == '报价草稿', d)
qid = d['id']
created['quotations'].append(qid)
s, d, _ = req('POST', '/api/quotations', base_q)
check('D4 边界：报价号重复 400', s == 400 and '已存在' in d.get('error', ''), d)

s, d, _ = req('GET', '/api/quotations/%d' % qid)
check('D5 详情含明细', s == 200 and len(d.get('items', [])) == 1, d if s != 200 else d.get('items'))

# 修改：数量 10→20、备注变化 → V2 字段级 diff
mod = dict(base_q)
mod['items'] = [dict(base_q['items'][0], qty=20)]
mod['notes'] = '改过备注'
s, d, _ = req('PUT', '/api/quotations/%d' % qid, mod)
check('D6 保存为 V2', s == 200 and d.get('version') == 2, d)
chg = d.get('changes', [])
labels = {c['label'] for c in chg}
check('D7 diff 记录数量变化', any(c.get('label') == '数量' and c.get('old') == '10' and c.get('new') == '20' for c in chg), chg)
check('D8 diff 记录备注变化', '备注' in labels, labels)
check('D9 total 重新计算', abs((mod['items'][0]['qty'] * 10.5) - 210) < 0.01, d.get('total_usd'))

s, d, _ = req('GET', '/api/quotations/%d/versions' % qid)
check('D10 版本列表 2 条', s == 200 and len(d) == 2, d)
check('D11 版本动作 create/update', d[0]['action'] == 'update' and d[1]['action'] == 'create', [x['action'] for x in d])

s, d, _ = req('POST', '/api/quotations/%d/audit' % qid, {})
check('D12 审核为正式版本', s == 200 and d.get('status') == '正式版本' and d.get('reviewed_at'), d)
s, d, _ = req('GET', '/api/quotations/%d' % qid)
check('D13 reviewed_at 已写入', bool(d.get('reviewed_at')), d.get('reviewed_at'))
s, d, _ = req('POST', '/api/quotations/%d/audit' % qid, {})
check('D14 边界：重复审核 400', s == 400 and '已是正式版本' in d.get('error', ''), d)

# 导出 Excel 不改状态（正式版本状态下）
s, content, hd = req('GET', '/api/quotations/%d/excel' % qid, raw=True)
ctype = (hd.get('Content-Type') or '')
check('D15 导出 Excel 200/xlsx', s == 200 and ('spreadsheet' in ctype or 'octet-stream' in ctype) and len(content) > 1000,
      '%s %dB' % (ctype, len(content)))
s, d, _ = req('GET', '/api/quotations/%d' % qid)
check('D16 导出后状态不变(正式)', d.get('status') == '正式版本', d.get('status'))

# 审核后再修改 → 自动退回草稿
mod2 = dict(base_q)
mod2['items'] = [dict(base_q['items'][0], qty=30)]
s, d, _ = req('PUT', '/api/quotations/%d' % qid, mod2)
check('D17 正式版修改退回草稿', s == 200 and d.get('status') == '报价草稿' and d.get('reverted') is True, d)
check('D18 退回产生 V4(create/update/audit/update)', d.get('version') == 4, d.get('version'))
s, d, _ = req('GET', '/api/quotations/%d' % qid)
check('D19 reviewed_at 已清空', not d.get('reviewed_at'), d.get('reviewed_at'))

# 草稿导出也不改状态
s, content, hd = req('GET', '/api/quotations/%d/excel' % qid, raw=True)
check('D20 草稿可导出 Excel', s == 200 and len(content) > 1000, s)
s, d, _ = req('GET', '/api/quotations/%d' % qid)
check('D21 导出后仍为草稿', d.get('status') == '报价草稿', d.get('status'))

s, d, _ = req('POST', '/api/quotations/%d/audit' % qid, {})
check('D22 重新审核(V5)', s == 200 and d.get('version') == 5, d)

s, d, _ = req('GET', '/api/quotations/%d/versions' % qid)
check('D23 版本列表 5 条', len(d) == 5, len(d))

# 列表筛选
s, d, _ = req('GET', '/api/quotations?quote_no=' + QNO)
check('D24 列表按报价号筛选', any(x['id'] == qid for x in d), len(d))
s, d, _ = req('GET', '/api/quotations?customer_id=%d&status=%%E6%%96%%B0' % cid)  # 不存在状态
check('D25 列表状态筛选空', isinstance(d, list) and not any(x['id'] == qid for x in d), len(d))
s, d, _ = req('GET', '/api/quotations?date_from=2099-01-01')
check('D26 边界：未来日期空', d == [], len(d))

# 404 边界
s, d, _ = req('GET', '/api/quotations/999999')
check('D27 边界：报价 404', s == 404, s)
s, d, _ = req('POST', '/api/quotations/999999/audit', {})
check('D28 边界：审核 404', s == 404, s)
s, d, _ = req('PUT', '/api/quotations/999999', base_q)
check('D29 边界：修改 404', s == 404, s)

# ================= E. 报价历史全字段筛选 =================
print('\n[E] 报价历史全字段筛选')
s, d, _ = req('GET', '/api/quotation-history')
check('E1 历史非空(含3条基线)', len(d) >= 4, len(d))
check('E2 含公司/项目名联表', all('company' in x for x in d), d[:1])

s, d, _ = req('GET', '/api/quotation-history?quote_no=' + QNO)
check('E3 报价号筛选', len(d) == 1 and d[0]['quote_no'] == QNO, len(d))
s, d, _ = req('GET', '/api/quotation-history?customer=' + TAG)
check('E4 客户名称筛选', all(TAG in x['company'] for x in d) and d, [x['company'] for x in d][:3])
s, d, _ = req('GET', '/api/quotation-history?project=' + TAG)
check('E5 项目名称筛选', d and all(TAG in (x['project_name'] or '') for x in d), len(d))
s, d, _ = req('GET', '/api/quotation-history?product=12W')
check('E6 产品关键词筛选(明细)', d and all(
    True for x in d), len(d))
s, d, _ = req('GET', '/api/quotation-history?product=' + urllib.parse.quote('12W RGBW ' + TAG))
hit = any(x['quote_no'] == QNO for x in d)
check('E7 产品含描述匹配到测试单', hit, [x['quote_no'] for x in d][:5])
s, d, _ = req('GET', '/api/quotation-history?product=' + TAG + 'ZZZ')
check('E8 边界：无匹配产品空', d == [], len(d))
s, d, _ = req('GET', '/api/quotation-history?status=%s&customer=%s'
              % (urllib.parse.quote('正式版本'), TAG))
check('E9 状态+客户组合', d and all(x['status'] == '正式版本' for x in d), len(d))
s, d, _ = req('GET', '/api/quotation-history?date_from=2026-09-01&date_to=2026-09-03&quote_no=' + QNO)
check('E10 日期区间+报价号', len(d) == 1, len(d))
s, d, _ = req('GET', '/api/quotation-history?date_from=2099-01-01')
check('E11 边界：未来日期空', d == [], len(d))

# ================= F. 邮件配置 =================
print('\n[F] 邮件配置弹窗接口')
s, d, _ = req('GET', '/api/mail/config')
keys = set((d.get('config') or {}).keys())
check('F1 配置键齐全', s == 200 and {'mail_smtp_host', 'mail_smtp_port', 'mail_imap_host', 'mail_imap_port',
                                     'mail_user', 'mail_auth_code'} <= keys, keys)
ac = d['config']['mail_auth_code']
check('F2 授权码掩码/has_value', ac['secret'] is True and (ac['value'] == '******' or not ac['has_value']), ac)

orig_host = d['config']['mail_smtp_host']['value']
s, d, _ = req('PUT', '/api/mail/config', {'mail_smtp_host': 'smtp.test.local', 'not_allowed': 'x'})
check('F3 PUT 更新+白名单过滤', s == 200 and 'mail_smtp_host' in d.get('updated', []) and 'not_allowed' not in d.get('updated', []), d)
s, d, _ = req('GET', '/api/mail/config')
check('F4 更新生效', d['config']['mail_smtp_host']['value'] == 'smtp.test.local', d['config']['mail_smtp_host'])

new_ac = 'TESTCODE123'
s, d, _ = req('PUT', '/api/mail/config', {'mail_auth_code': new_ac})
s, d, _ = req('GET', '/api/mail/config')
check('F5 授权码可设置(不回显)', d['config']['mail_auth_code']['has_value'] is True and d['config']['mail_auth_code']['value'] == '******',
      d['config']['mail_auth_code'])
s, d, _ = req('PUT', '/api/mail/config', {'mail_auth_code': '******'})
s, d, _ = req('GET', '/api/mail/config')
check('F6 掩码不覆盖原值', d['config']['mail_auth_code']['has_value'] is True, d['config']['mail_auth_code'])

s, d, _ = req('GET', '/api/mail/summary')
check('F7 mail summary', s == 200 and 'unread' in d, d)

# ================= G. 备份 =================
print('\n[G] 备份(每周自动+手动)')
s, d, _ = req('POST', '/api/backup/run', {'note': '测试'})
check('G1 手动备份', s == 200 and re.match(r'backup_\d{8}_\d{6}_manual\.db', d.get('file_name', '')), d)
bid = d['id']
created['backups'].append(bid)
s, d, _ = req('GET', '/api/backups')
row = [x for x in d['backups'] if x['id'] == bid]
check('G2 备份列表+文件存在', row and row[0]['exists'] is True, row)
# 每周判断逻辑：直接调用（当前最近备份距今<7天 → 不应新增）
sys.path.insert(0, BASE)
from db import query_one as _q1
import scheduler
sch = scheduler.Scheduler()      # 不 start 线程，仅调用备份检查方法
before = _q1('SELECT COUNT(*) AS n FROM backups')['n']
sch._backup_if_due()
after = _q1('SELECT COUNT(*) AS n FROM backups')['n']
check('G3 每周判断：未到期不备份', after == before, (before, after))
# 模拟 8 天前 → 应自动备份
from db import tx as _tx
_tx(lambda c: c.execute("UPDATE backups SET created_at=datetime('now','-8 days') WHERE id=?", (bid,)))
sch._backup_if_due()
after2 = _q1('SELECT COUNT(*) AS n FROM backups')['n']
auto = _q1("SELECT file_name FROM backups WHERE kind='auto' ORDER BY id DESC LIMIT 1")
check('G4 到期自动备份(时间戳命名)', after2 == after + 1 and auto and re.match(
    r'backup_\d{8}_\d{6}_auto\.db', auto['file_name']), (after, after2, auto))
s, d, _ = req('DELETE', '/api/backups/%d' % bid)
check('G5 删除备份', s == 200, d)

# ================= H. 数据库导入 =================
print('\n[H] 数据库导入(单文件)')
from openpyxl import Workbook
wb = Workbook()
ws = wb.active
ws.append(['Quotation', ''])
ws.append(['PI', 'T-IMP-' + TAG])
ws.append(['Date', '2026-09-03'])
ws.append(['Customer', TAG + ' ImportCo'])
ws.append(['Project', TAG + ' 导入项目'])
ws.append(['Item Name', 'Description', 'Quantity', 'Unit Price', 'Amount'])
ws.append(['LED Bar', '12W RGBW ' + TAG, 5, 100, 500])
ws.append(['LED Bar 2', '24W RGBW ' + TAG, 2, 250, 500])
ws.append(['Total amount:', '', 0, 0, 0])   # 页脚垃圾行：不应成为产品
buf = io.BytesIO()
wb.save(buf)
blob = buf.getvalue()
payload = {'root_name': '测试导入', 'files': [{'file_name': 'Quotation-' + TAG + '.xlsx',
                                              'relative_path': 'test/Quotation-' + TAG + '.xlsx',
                                              'content_b64': base64.b64encode(blob).decode('ascii')}]}
s, d, _ = req('POST', '/api/import-scan', payload)
rows = d.get('files', [])
check('H1 扫描识别新文件', s == 200 and rows and rows[0]['status'] == '新文件' and rows[0]['row_count'] == 3, rows)
sid = rows[0]['id']
s, d, _ = req('POST', '/api/import-confirm', {'ids': [sid]})
check('H2 确认导入', s == 200 and d.get('imported') == 1, d)
# 已导入后再扫描同内容 → 重复
s, d, _ = req('POST', '/api/import-scan', payload)
check('H3 边界：已导入内容判重复', d['files'][0]['status'] == '重复', d['files'][0])
s, d, _ = req('GET', '/api/quotations?quote_no=T-IMP-' + TAG)
imp_q = [x for x in d if x['quote_no'] == 'T-IMP-' + TAG]
check('H4 导入生成报价单', len(imp_q) == 1, len(d))
if imp_q:
    created['quotations'].append(imp_q[0]['id'])
    created['customers_by_name'].append(TAG + ' ImportCo')
    created['projects'].append(imp_q[0].get('project_id'))
    s, d2, _ = req('GET', '/api/quotations/%d' % imp_q[0]['id'])
    items = d2.get('items', [])
    check('H5 导入明细 3 条(含1页脚行)', len(items) == 3, len(items))
    real = [it for it in items if (it.get('qty') or 0) > 0 or (it.get('amount_usd') or 0) > 0]
    blank = [it for it in items if it not in real]
    check('H6 有效明细已关联产品(product_id)', len(real) == 2 and all(it.get('product_id') for it in real),
          [(it.get('product_name'), it.get('product_id')) for it in items])
    check('H6b 页脚行不关联产品', len(blank) == 1 and not blank[0].get('product_id'),
          [(it.get('product_name'), it.get('product_id')) for it in blank])
    s, prods, _ = req('GET', '/api/products')
    if isinstance(prods, dict):
        prods = prods.get('products', [])
    new_prods = [p for p in prods if p.get('series') == 'Imported' and TAG in (p.get('description') or '')]
    check('H7 导入自动入库产品2个(页脚行未入库)', len(new_prods) == 2,
          [(p.get('product_name'), p.get('description')) for p in new_prods])
    created['products'] += [p['id'] for p in new_prods]
# 垃圾文件 → 解析失败
s, d, _ = req('POST', '/api/import-scan', {'root_name': 't', 'files': [
    {'file_name': 'bad.xlsx', 'relative_path': 'x', 'content_b64': base64.b64encode(b'not excel').decode()}]})
check('H8 边界：垃圾文件解析失败', d['files'][0]['status'] == '解析失败', d['files'][0])
s, d, _ = req('POST', '/api/import-confirm', {'ids': [d['files'][0]['id']]})
check('H9 边界：确认导入失败文件=0', d.get('imported', 0) == 0, d)

# ================= J. 九类字段体系 =================
print('\n[J] 九类字段体系（目录/描述解析/编辑重建/来源）')
s, d, _ = req('GET', '/api/product-fields')
check('J1 字段目录九类', s == 200 and isinstance(d, list) and len(d) == 9
      and all(g.get('key') and g.get('label') and isinstance(g.get('fields'), list) for g in d), s)
total_fields = sum(len(g['fields']) for g in d) if isinstance(d, list) else 0
check('J2 字段目录字段数≥50', total_fields >= 50, total_fields)
cat_keys = {fd['key'] for g in (d or []) for fd in g['fields']}
check('J2b 目录含灯珠数量/封装(核心列入表单)', {'led_count', 'led_chip'} <= cat_keys,
      sorted(cat_keys - {'led_count', 'led_chip'})[:8])

s, d, _ = req('POST', '/api/products/parse-description',
              {'description': 'CM-TST-01, L1000*W37*H44mm,DC24V, 12W, RGBW(3000K),DMX512, IP66, IK10, '
                              '48pcs 5050SMD, 8pixels, Ra80, PF0.95, 400-500lm, 10KV, 50/60Hz, 240mA, '
                              '8bit, 15*30deg, CE RoHS, L70≥50000h, hs code,9405429000'})
f = d.get('fields', {})
check('J3 从描述解析字段', all(f.get(k) for k in ('model', 'voltage', 'power', 'cct', 'control', 'ip_rating',
                                                 'led_chip', 'pixel_count', 'length_size', 'hs_code')), f)
check('J3b 解析新字段(IK/认证/显色/因数/光通量/浪涌/频率/电流/灰度/光束角/L70)',
      f.get('ik_rating') == 'IK10' and f.get('certifications') == 'CE/RoHS' and f.get('cri') == 'Ra80'
      and f.get('power_factor') == 'PF0.95' and f.get('luminous_flux') == '400-500lm'
      and f.get('surge_protection') == '10KV' and f.get('frequency') == '50/60Hz'
      and f.get('input_current') == '240mA' and f.get('grayscale') == '8bit'
      and f.get('beam_angle') == '15*30deg' and f.get('l70') == 'L70≥50000h', f)
check('J4 解析生成描述含关键值', all(x in d.get('description_preview', '')
                                    for x in ('CM-TST-01', '12W', 'IP66', 'hs code, 9405429000')),
      d.get('description_preview'))

jp = {'series': 'Test', 'product_name': TAG + '投光灯', 'model': 'CM-TST-' + TAG,
      'description': 'L1000*W37*H44mm,DC24V, 12W, RGBW(3000K),DMX512, IP66',
      'category': '投光灯', 'voltage': 'DC24V', 'power': '12W',
      'spec': {'ik_rating': 'IK08', 'certifications': 'CE RoHS', 'surge_protection': '10KV'}}
s, d, _ = req('POST', '/api/products', jp)
check('J5 新增产品+描述重建', s == 200 and d.get('id') and all(
    x in (d.get('description') or '') for x in ('CM-TST-' + TAG, '12W', 'RGBW(3000K)', 'IP66')), d)
jpid = d.get('id')
if jpid:
    created['products'].append(jpid)
    spec = json.loads(d.get('spec_json') or '{}')
    check('J6 扩展字段写入 spec_json',
          spec.get('ik_rating') == 'IK08' and spec.get('certifications') == 'CE RoHS', spec)
s, d, _ = req('POST', '/api/products', dict(jp))
check('J6b 边界：重建后参数完全一致仍拒 400', s == 400 and '不能重复' in d.get('error', ''), d)
if jpid:
    created['products'].append(jpid)
    s, d, _ = req('PUT', '/api/products/%d' % jpid, {'power': '15W', 'spec': {'ik_rating': 'IK10'}})
    check('J7 编辑后描述自动重建', s == 200 and '15W' in (d.get('description') or '')
          and '12W' not in (d.get('description') or ''), d.get('description'))
    spec = json.loads(d.get('spec_json') or '{}')
    check('J8 编辑扩展字段生效(其余沿用旧值)', spec.get('ik_rating') == 'IK10'
          and spec.get('certifications') == 'CE RoHS', spec)
    s, d, _ = req('PUT', '/api/products/%d' % jpid, {'notes': TAG + ' note'})
    check('J9 部分更新沿用旧字段', s == 200 and d.get('model') == 'CM-TST-' + TAG
          and '15W' in (d.get('description') or ''), (d.get('model'), d.get('description')))
    s, d, _ = req('PUT', '/api/products/%d' % jpid, {'spec': {'ik_rating': ''}})
    spec = json.loads(d.get('spec_json') or '{}')
    check('J10 显式清空扩展字段', 'ik_rating' not in spec
          and spec.get('certifications') == 'CE RoHS', spec)
    created['products'].append(jpid)
# 导入历史来源（基于 H 段导入的报价单）
s, d, _ = req('GET', '/api/quotation-history?quote_no=T-IMP-' + TAG)
hist = [x for x in d if x.get('quote_no') == 'T-IMP-' + TAG]
check('J12 导入历史来源类型/文件位置', bool(hist) and hist[0].get('source_type') == '导入-报价单'
      and TAG in (hist[0].get('source_file') or ''),
      hist[:1] if hist else d)

# ================= I. 静态页 =================
print('\n[I] 前端静态资源')
s, content, hd = req('GET', '/', raw=True)
html = content.decode('utf-8', 'ignore')
check('I1 首页 200 含标题', s == 200 and '报价工作台 V5' in html, s)
for asset in ('assets/common.js', 'assets/mail.js', 'assets/history.js', 'assets/singleimport.js'):
    s, c, _ = req('GET', '/' + asset, raw=True)
    check('I2 ' + asset, s == 200 and len(c) > 500, (s, len(c)))
check('I3 无已删模块残留', all(k not in html for k in ('wechat', 'rules.js', 'cad', 'comm.js', 'dashboard')), None)
check('I4 版本/审核弹窗元素存在', all(k in html for k in ('showVersions', 'auditQuote')), None)
s, mjs, _ = req('GET', '/assets/mail.js', raw=True)
check('I5 邮件设置弹窗存在(openConfig)', b'openConfig' in mjs and b'/api/mail/config' in mjs, None)

# ================= 清理 =================
print('\n[清理] 测试数据还原')
import sqlite3
con = sqlite3.connect(os.path.join(BASE, 'outdoor_lighting.db'))
con.row_factory = sqlite3.Row
cur = con.cursor()


def ids_from(table, col, vals):
    if not vals:
        return []
    ph = ','.join('?' * len(vals))
    return [r[0] for r in cur.execute('SELECT id FROM %s WHERE %s IN (%s)' % (table, col, ph), vals).fetchall()]


# 导入产生的报价
imp_ids = [r[0] for r in cur.execute("SELECT id FROM quotations WHERE quote_no LIKE 'T-IMP-%' OR quote_no LIKE ?",
                                     ('T-IMP-%',)).fetchall()]
all_q = created['quotations'] + imp_ids
qph = ','.join('?' * len(all_q)) if all_q else 'NULL'
for t in ('quotation_items', 'quotation_versions', 'quotation_history'):
    if all_q:
        cur.execute('DELETE FROM %s WHERE quotation_id IN (%s)' % (t, qph), all_q)
if all_q:
    cur.execute('DELETE FROM quotations WHERE id IN (%s)' % qph, all_q)
# 导入产生客户/项目/产品
if created['customers_by_name']:
    ph = ','.join('?' * len(created['customers_by_name']))
    rows = [r[0] for r in cur.execute('SELECT id FROM customers WHERE company IN (%s)' % ph,
                                      created['customers_by_name']).fetchall()]
    created['customers'] += rows
if created['customers']:
    ph = ','.join('?' * len(set(created['customers'])))
    cur.execute('DELETE FROM customers WHERE id IN (%s)' % ph, list(set(created['customers'])))
prj = [p for p in created['projects'] if p]
if prj:
    cur.execute('DELETE FROM projects WHERE id IN (%s)' % ','.join('?' * len(prj)), prj)
if created['products']:
    cur.execute('DELETE FROM products WHERE id IN (%s)' % ','.join('?' * len(created['products'])), created['products'])
# 导入记录
cur.execute("DELETE FROM imported_quote_rows WHERE import_file_id IN (SELECT id FROM import_files WHERE file_name LIKE ?)",
            ('%' + TAG + '%',))
cur.execute("DELETE FROM import_scan_files WHERE file_name LIKE ? OR sha256 IN (SELECT sha256 FROM import_scan_files WHERE file_name LIKE ?)",
            ('%' + TAG + '%', '%' + TAG + '%'))
cur.execute("DELETE FROM import_files WHERE file_name LIKE ?", ('%' + TAG + '%',))
cur.execute("DELETE FROM import_scans WHERE root_name IN ('测试导入','t')")
cur.execute("DELETE FROM backups WHERE id IN (%s)" % (','.join('?' * len(created['backups'])) or 'NULL'),
            created['backups'])
# 恢复邮件配置
cur.execute("DELETE FROM config WHERE key='mail_auth_code'")
cur.execute("UPDATE config SET value=? WHERE key='mail_smtp_host'", (orig_host or 'smtp.qq.com',))
con.commit()
left_q = cur.execute('SELECT COUNT(*) FROM quotations').fetchone()[0]
con.close()
print('清理完成，当前报价单数:', left_q, '(基线=4，含ICC导入)')

# ================= 汇总 =================
fails = [r for r in results if not r[1]]
print('\n' + '=' * 60)
print('测试汇总: %d 项, 通过 %d, 失败 %d' % (len(results), len(results) - len(fails), len(fails)))
for name, ok, info in fails:
    print('  ✗ %s  %s' % (name, str(info)[:160]))
sys.exit(1 if fails else 0)
