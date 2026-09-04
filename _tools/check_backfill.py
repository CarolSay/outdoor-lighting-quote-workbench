# -*- coding: utf-8 -*-
"""回填结果抽查（一次性）。"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import query_all

rows = query_all('SELECT id,product_code,model,power,voltage,ip_rating,control,pixel_count,hs_code,'
                 'length_size,notes FROM products WHERE active=1 ORDER BY id LIMIT 8')
for r in rows:
    print(r)
print('--- spec_json 非空产品数 ---')
print(query_all("SELECT COUNT(*) AS n FROM products WHERE spec_json IS NOT NULL AND spec_json<>'{}'")[0])
print('--- history ---')
for r in query_all('SELECT id,quote_no,source_type,source_file FROM quotation_history'):
    print(r)
