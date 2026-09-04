# -*- coding: utf-8 -*-
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import query_all

rows = query_all('SELECT h.id,h.quotation_id,h.quote_no,h.customer_id,c.company AS joined, '
                 '(SELECT company FROM customers WHERE id=h.customer_id) AS direct_company '
                 'FROM quotation_history h LEFT JOIN customers c ON c.id=h.customer_id')
for r in rows:
    print(r)
print('裸行数:', query_all('SELECT COUNT(*) n FROM quotation_history')[0]['n'])
print('join行数:', len(rows))
