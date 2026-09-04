# -*- coding: utf-8 -*-
"""一次性回填（九类字段体系上线后执行一次）：
1) 现有产品：解析描述 → 仅填充空的核心列（不覆盖已有值），扩展字段并入 spec_json（已有 spec 值优先）；
2) 报价历史：补全来源类型/文件位置 —— 优先按 quote_no 关联 import_files 的 doc_type 与 relative_path，
   兜底解析报价单备注里的"导入来源：<路径>"。
运行：python _tools/backfill_fields.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import tx, query_all  # noqa: E402
from services.spec_fields import SPEC_KEYS, parse_description_safe  # noqa: E402
import schema  # noqa: E402

schema.ensure_schema()   # 兼容列迁移（products.spec_json 等），幂等

# 描述可解析出的核心列（与 services.quotes._PARSE_COL_MAP 保持一致，notes 单独处理）
FILL_COLS = ['model', 'voltage', 'power', 'cct_color', 'cct', 'control', 'ip_rating', 'beam_angle',
             'length_size', 'led_count', 'pixel_count', 'led_chip', 'material', 'body_color', 'hs_code']


def backfill_products():
    rows = query_all('SELECT * FROM products WHERE active=1')
    stats = {'scanned': len(rows), 'core_filled': 0, 'spec_filled': 0}

    def work(c):
        for r in rows:
            fields = parse_description_safe(r.get('description') or '')
            if not fields:
                continue
            sets, vals = [], []
            for col in FILL_COLS:
                if not (r.get(col) or '').strip() and fields.get(col):
                    sets.append('%s=?' % col)
                    vals.append(fields[col])
                    stats['core_filled'] += 1
            if not r.get('notes') and fields.get('notes'):
                sets.append('notes=?')
                vals.append(fields['notes'])
            # spec_json：解析出的扩展字段并入（已有值优先，不覆盖）
            try:
                spec = json.loads(r.get('spec_json') or '{}')
            except Exception:
                spec = {}
            spec = spec if isinstance(spec, dict) else {}
            before = len(spec)
            for k in SPEC_KEYS:
                if k == 'notes':
                    continue
                if not str(spec.get(k) or '').strip() and fields.get(k):
                    spec[k] = fields[k]
                    stats['spec_filled'] += 1
            if sets or len(spec) != before or (spec and not r.get('spec_json')):
                sets.append('spec_json=?')
                vals.append(json.dumps(spec, ensure_ascii=False) if spec else None)
            if sets:
                sets.append('updated_at=CURRENT_TIMESTAMP')
                c.execute('UPDATE products SET %s WHERE id=?' % ','.join(sets), vals + [r['id']])
        return stats
    return tx(work)


def backfill_history_source():
    rows = query_all('SELECT h.id,h.quotation_id,h.quote_no,h.source_type,h.source_file '
                     'FROM quotation_history h')
    stats = {'scanned': len(rows), 'updated': 0}

    def work(c):
        for h in rows:
            if (h.get('source_file') or '').strip() and (h.get('source_type') or '').strip() not in ('', '手动创建', '导入'):
                continue
            qno = h.get('quote_no')
            f = None
            if qno:
                f = c.execute('SELECT doc_type,relative_path FROM import_files WHERE quote_no=? '
                              'ORDER BY id DESC LIMIT 1', (qno,)).fetchone()
            notes_path = ''
            if h.get('quotation_id'):
                q = c.execute('SELECT notes FROM quotations WHERE id=?', (h['quotation_id'],)).fetchone()
                if q and q['notes'] and q['notes'].startswith('导入来源：'):
                    notes_path = q['notes'][len('导入来源：'):].strip()
            if f:
                stype = '导入-PI' if f['doc_type'] == 'pi' else '导入-报价单'
                sfile = f['relative_path'] or notes_path
            elif notes_path:
                stype, sfile = '导入', notes_path
            else:
                continue
            c.execute('UPDATE quotation_history SET source_type=?,source_file=? WHERE id=?',
                      (stype, sfile, h['id']))
            stats['updated'] += 1
        return stats
    return tx(work)


if __name__ == '__main__':
    p = backfill_products()
    h = backfill_history_source()
    print('产品回填:', p)
    print('历史来源回填:', h)
