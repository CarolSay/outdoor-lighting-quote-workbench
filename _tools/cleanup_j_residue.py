# -*- coding: utf-8 -*-
"""删除 CM-TST-V5T 测试残留产品（一次性）。"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import query_one, tx

n = query_one("SELECT COUNT(*) AS n FROM products WHERE model LIKE 'CM-TST-V5T%'")['n']
tx(lambda c: c.execute("DELETE FROM products WHERE model LIKE 'CM-TST-V5T%' OR product_name LIKE '%投光灯' "
                       "AND series='Test'"))
print('residue removed:', n)
