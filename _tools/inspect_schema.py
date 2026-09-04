# -*- coding: utf-8 -*-
import sqlite3
c = sqlite3.connect(r'd:\AI\2026-09\v4\outdoor_lighting.db')
for t in ('imported_quote_rows', 'import_files'):
    r = c.execute("SELECT sql FROM sqlite_master WHERE name=?", (t,)).fetchone()
    print(t, ':', (r[0][:400] if r else 'N/A'))
    print()
print('rows:', c.execute('SELECT COUNT(*) FROM imported_quote_rows').fetchone()[0])
