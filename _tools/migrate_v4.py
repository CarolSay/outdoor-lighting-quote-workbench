# -*- coding: utf-8 -*-
"""V4 -> V5 数据迁移：新库只保留 3 条已成功导出(正式)报价单的相关数据。
用法: python _tools/migrate_v4.py [--src d:/AI/2026-09/v4/outdoor_lighting.db]
"""
import os
import sqlite3
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(os.path.dirname(BASE), 'v4', 'outdoor_lighting.db')
DST = os.path.join(BASE, 'outdoor_lighting.db')

for i, a in enumerate(sys.argv):
    if a == '--src' and i + 1 < len(sys.argv):
        SRC = sys.argv[i + 1]

sys.path.insert(0, BASE)
import schema  # noqa: E402
schema.ensure_schema()
from db import conn  # noqa: E402

src = sqlite3.connect(SRC)
src.row_factory = sqlite3.Row

# 1) 确定要保留的报价单（quotation_history 中的 3 条正式记录）
qids = [r[0] for r in src.execute('SELECT quotation_id FROM quotation_history ORDER BY quotation_id')]
print('保留报价单:', qids)
assert len(qids) == 3, '期望 3 条正式报价，实际 %d' % len(qids)

qrows = {r['id']: r for r in src.execute('SELECT * FROM quotations')}
qitems = list(src.execute('SELECT * FROM quotation_items WHERE quotation_id IN (%s)' % ','.join('?' * len(qids)), qids))
# 历史行自身的 customer/project/provider 可能与主表不同，一并纳入保留范围
hrows = list(src.execute('SELECT * FROM quotation_history WHERE quotation_id IN (%s)' % ','.join('?' * len(qids)), qids))

customer_ids = sorted({qrows[q]['customer_id'] for q in qids if qrows[q]['customer_id']}
                      | {h['customer_id'] for h in hrows if h['customer_id']})
project_ids = sorted({qrows[q]['project_id'] for q in qids if qrows[q]['project_id']}
                     | {h['project_id'] for h in hrows if h['project_id']})
provider_ids = sorted({qrows[q]['provider_id'] for q in qids if qrows[q]['provider_id']}
                      | {h['provider_id'] for h in hrows if h['provider_id']})
product_ids = sorted({it['product_id'] for it in qitems if it['product_id']})
quote_nos = [qrows[q]['quote_no'] for q in qids]
print('客户:', customer_ids, '项目:', project_ids, 'Provider:', provider_ids, '产品:', len(product_ids), '个')

# 关联的导入文件（按 quote_no 匹配）
file_ids = [r['id'] for r in src.execute(
    'SELECT id FROM import_files WHERE quote_no IN (%s)' % ','.join('?' * len(quote_nos)), quote_nos)]
print('关联导入文件:', file_ids)

dst = conn()


def copy(table, ids, col='id'):
    if not ids:
        return 0
    ph = ','.join('?' * len(ids))
    rows = src.execute('SELECT * FROM %s WHERE %s IN (%s)' % (table, col, ph), ids).fetchall()
    if not rows:
        return 0
    cols = rows[0].keys()
    sql = 'INSERT OR REPLACE INTO %s(%s) VALUES (%s)' % (table, ','.join(cols), ','.join('?' * len(cols)))
    dst.executemany(sql, [tuple(r) for r in rows])
    return len(rows)


def copy_all(table):
    rows = src.execute('SELECT * FROM %s' % table).fetchall()
    if not rows:
        return 0
    cols = rows[0].keys()
    sql = 'INSERT OR REPLACE INTO %s(%s) VALUES (%s)' % (table, ','.join(cols), ','.join('?' * len(cols)))
    dst.executemany(sql, [tuple(r) for r in rows])
    return len(rows)


dst.execute('PRAGMA foreign_keys=OFF')
counts = {}
counts['customers'] = copy('customers', customer_ids)
counts['providers'] = copy('providers', provider_ids)
counts['products'] = copy('products', product_ids)
counts['projects'] = copy('projects', project_ids)
counts['quotations'] = copy('quotations', qids)
counts['quotation_items'] = len(qitems)
cols = qitems[0].keys() if qitems else None
if cols:
    dst.executemany('INSERT OR REPLACE INTO quotation_items(%s) VALUES (%s)'
                    % (','.join(cols), ','.join('?' * len(cols))), [tuple(r) for r in qitems])
counts['quotation_history'] = copy('quotation_history', qids, 'quotation_id')
counts['import_files'] = copy('import_files', file_ids)
if file_ids:
    counts['imported_quote_rows'] = copy('imported_quote_rows', file_ids, 'import_file_id')
counts['config'] = copy_all('config')

# 2) 为 3 条报价补写 V1 版本记录（create），让「版本」弹窗不空
from routes.core import QUOTE_HEADER_FIELDS  # noqa: E402
import json  # noqa: E402
for q in qids:
    row = qrows[q]
    snap = {k: row[k] for k, _ in QUOTE_HEADER_FIELDS}
    snap['status'] = row['status']
    snap['total_usd'] = row['total_usd']
    snap['expiry_date'] = row['expiry_date']
    snap['items'] = [dict(x) for x in src.execute(
        'SELECT * FROM quotation_items WHERE quotation_id=? ORDER BY item_no', (q,))]
    dst.execute('DELETE FROM quotation_versions WHERE quotation_id=?', (q,))
    dst.execute('INSERT INTO quotation_versions(quotation_id,version_no,action,changes,snapshot,created_at) '
                'VALUES (?,?,?,?,?,?)',
                (q, 1, 'create', '[]', json.dumps(snap, ensure_ascii=False), row['updated_at']))
counts['quotation_versions'] = len(qids)

dst.execute('PRAGMA foreign_keys=ON')
dst.commit()
dst.execute('VACUUM')
dst.close()
src.close()

print('迁移完成:')
for k, v in counts.items():
    print('  %-20s %d 行' % (k, v))
