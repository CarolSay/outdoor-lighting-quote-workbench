# -*- coding: utf-8 -*-
"""临时：检查 v4 数据库结构与数据，确定迁移范围（用后可删）"""
import sqlite3

c = sqlite3.connect(r'd:\AI\2026-09\v4\outdoor_lighting.db')
c.row_factory = sqlite3.Row


def q(sql):
    try:
        return [dict(r) for r in c.execute(sql).fetchall()]
    except Exception as e:
        return 'ERR: %s' % e


print('--- tables ---')
print([r['name'] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")])
print('--- quotation_history ---')
for r in q('SELECT id,quotation_id,quote_no,quote_date,total_usd,status,created_at FROM quotation_history ORDER BY id'):
    print(r)
print('--- quotations ---')
for r in q('SELECT id,quote_no,quote_date,customer_id,project_id,provider_id,status,is_formal,total_usd,created_at FROM quotations ORDER BY id'):
    print(r)
print('--- counts ---')
for t in ['customers', 'products', 'projects', 'providers', 'quotation_items', 'quotation_history',
          'import_files', 'imported_quote_rows', 'import_scan_files', 'import_scans', 'emails',
          'email_attachments', 'activity_log', 'backups', 'communication_history', 'wechat_scans',
          'wechat_files', 'rules', 'price_list', 'settings', 'config']:
    r = q('SELECT COUNT(*) n FROM %s' % t)
    print(t, r[0]['n'] if isinstance(r, list) else r)
print('--- config keys ---')
for r in q('SELECT key, CASE WHEN key LIKE "%auth%" OR key LIKE "%key%" THEN "***" ELSE value END v FROM config'):
    print(r['key'], '=', r['v'])
print('--- exports dir ---')
import os
for f in os.listdir(r'd:\AI\2026-09\v4\data\exports'):
    print(f)
