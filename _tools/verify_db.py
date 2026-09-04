# -*- coding: utf-8 -*-
"""v5 库数据校验：各表行数 + 3 条报价关键信息"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import query_all

print('DB 大小: %.2f MB' % (os.path.getsize(os.path.join(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__))), 'outdoor_lighting.db')) / 1048576))
tabs = [r['name'] for r in query_all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
for t in tabs:
    n = query_all('SELECT COUNT(*) AS n FROM %s' % t)[0]['n']
    flag = '' if n else '  (空)'
    print('%-24s %4d%s' % (t, n, flag))
print()
for q in query_all('SELECT id,quote_no,quote_date,status,is_formal,total_usd,'
                   '(SELECT COUNT(*) FROM quotation_items WHERE quotation_id=q.id) items '
                   'FROM quotations q ORDER BY id'):
    print(q)
print()
for h in query_all('SELECT quotation_id,quote_no,status,total_usd FROM quotation_history ORDER BY quotation_id'):
    print(h)
print()
for v in query_all('SELECT quotation_id,version_no,action FROM quotation_versions ORDER BY quotation_id,version_no'):
    print(v)
