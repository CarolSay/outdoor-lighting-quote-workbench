# -*- coding: utf-8 -*-
"""报价工作台 V5(精简版) —— 全量表结构 DDL + 启动迁移。
首次启动创建全新数据库；业务数据由 tools/seed_db.py 从 v4 迁移（仅 3 条已导出报价单相关数据）。
"""
import os
import config as C
from db import conn, DB_LOCK

DDL = '''
CREATE TABLE IF NOT EXISTS customers(
 id INTEGER PRIMARY KEY AUTOINCREMENT, customer_code TEXT UNIQUE NOT NULL, company TEXT NOT NULL,
 country TEXT, city TEXT, customer_type TEXT, contact TEXT, email TEXT, whatsapp_phone TEXT,
 address TEXT, phone TEXT,
 currency TEXT DEFAULT 'USD', incoterm TEXT DEFAULT 'EXW', payment_terms TEXT, validity_days INTEGER DEFAULT 30,
 customer_grade TEXT, default_discount_pct REAL DEFAULT 0, notes TEXT, active INTEGER DEFAULT 1,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products(
 id INTEGER PRIMARY KEY AUTOINCREMENT, product_code TEXT UNIQUE NOT NULL, series TEXT NOT NULL, model TEXT,
 product_name TEXT, description TEXT, power TEXT, voltage TEXT, cct_color TEXT, control TEXT, ip_rating TEXT,
 beam_angle TEXT, length_size TEXT, led_count TEXT, pixel_count TEXT, led_chip TEXT, material TEXT,
 cct TEXT, category TEXT, body_color TEXT, hs_code TEXT, currency TEXT, moq TEXT, trade_terms TEXT,
 spec_json TEXT DEFAULT '{}',
 lifespan TEXT, working_temperature TEXT, storage_temperature TEXT, weight TEXT, brightness TEXT,
 data_cable TEXT, controller TEXT, notes TEXT,
 cost_usd REAL DEFAULT 0, standard_price_usd REAL DEFAULT 0, active INTEGER DEFAULT 1, source_page INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS projects(
 id INTEGER PRIMARY KEY AUTOINCREMENT, project_code TEXT UNIQUE NOT NULL, customer_id INTEGER NOT NULL,
 project_name TEXT NOT NULL, project_type TEXT, stage TEXT DEFAULT 'Lead', estimated_value_usd REAL DEFAULT 0,
 quotation_no TEXT, competitor TEXT, next_action TEXT, next_followup TEXT, probability_pct REAL DEFAULT 0,
 owner TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 status TEXT DEFAULT '报价中', modified_at TEXT);
CREATE TABLE IF NOT EXISTS quotations(
 id INTEGER PRIMARY KEY AUTOINCREMENT, quote_no TEXT UNIQUE NOT NULL, quote_date TEXT NOT NULL,
 customer_id INTEGER NOT NULL, project_id INTEGER, currency TEXT DEFAULT 'USD', incoterm TEXT DEFAULT 'EXW',
 payment_terms TEXT, validity_days INTEGER DEFAULT 30, status TEXT DEFAULT '报价草稿', total_usd REAL DEFAULT 0,
 notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 is_formal INTEGER DEFAULT 0, provider_id INTEGER, expiry_date TEXT, reviewed_at TEXT);
CREATE TABLE IF NOT EXISTS quotation_items(
 id INTEGER PRIMARY KEY AUTOINCREMENT, quotation_id INTEGER NOT NULL, item_no INTEGER, product_id INTEGER,
 product_name TEXT, description TEXT, qty REAL DEFAULT 0, unit TEXT DEFAULT 'pcs',
 unit_price_usd REAL DEFAULT 0, amount_usd REAL DEFAULT 0, our_price_usd REAL, our_amount_usd REAL);
CREATE TABLE IF NOT EXISTS quotation_versions(
 id INTEGER PRIMARY KEY AUTOINCREMENT, quotation_id INTEGER NOT NULL, version_no INTEGER NOT NULL,
 action TEXT DEFAULT 'update', changes TEXT DEFAULT '[]', snapshot TEXT DEFAULT '{}',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS quotation_history(
 id INTEGER PRIMARY KEY AUTOINCREMENT, quotation_id INTEGER, quote_no TEXT, quote_date TEXT, customer_id INTEGER,
 project_id INTEGER, currency TEXT, total_usd REAL, status TEXT DEFAULT '正式版本', notes TEXT,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP, provider_id INTEGER, expiry_date TEXT,
 source_type TEXT DEFAULT '手动创建', source_file TEXT);
CREATE TABLE IF NOT EXISTS providers(
 id INTEGER PRIMARY KEY AUTOINCREMENT, provider_code TEXT UNIQUE, provider_name TEXT NOT NULL,
 provider_info TEXT, active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS activity_log(
 id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT, entity_id INTEGER, action TEXT,
 detail TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS import_files(
 id INTEGER PRIMARY KEY AUTOINCREMENT, file_name TEXT NOT NULL, relative_path TEXT, file_ext TEXT,
 sha256 TEXT UNIQUE NOT NULL, file_size INTEGER DEFAULT 0, imported_at TEXT DEFAULT CURRENT_TIMESTAMP,
 status TEXT DEFAULT '已导入', message TEXT, workbook_blob BLOB, doc_type TEXT DEFAULT 'quotation',
 quote_no TEXT, quote_date TEXT, customer_text TEXT, project_name TEXT, unit TEXT);
CREATE TABLE IF NOT EXISTS imported_quote_rows(
 id INTEGER PRIMARY KEY AUTOINCREMENT, import_file_id INTEGER NOT NULL, sheet_name TEXT,
 project_name TEXT, item_name TEXT, description TEXT, quantity REAL, unit TEXT DEFAULT 'pcs',
 unit_price REAL, amount REAL, source_row INTEGER, raw_json TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(import_file_id) REFERENCES import_files(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS import_scans(
 id INTEGER PRIMARY KEY AUTOINCREMENT, root_name TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 status TEXT DEFAULT '待确认');
CREATE TABLE IF NOT EXISTS import_scan_files(
 id INTEGER PRIMARY KEY AUTOINCREMENT, scan_id INTEGER NOT NULL, file_name TEXT NOT NULL,
 relative_path TEXT, file_ext TEXT, file_size INTEGER DEFAULT 0, sha256 TEXT NOT NULL,
 status TEXT NOT NULL, message TEXT, workbook_blob BLOB, doc_type TEXT DEFAULT 'quotation',
 quote_no TEXT, quote_date TEXT, customer_text TEXT, customer_contact TEXT, customer_address TEXT,
 customer_phone TEXT, project_name TEXT, row_count INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(scan_id) REFERENCES import_scans(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS config(
 id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, value TEXT,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS emails(
 id INTEGER PRIMARY KEY AUTOINCREMENT, mailbox TEXT DEFAULT 'INBOX', uid INTEGER, message_id TEXT UNIQUE,
 from_name TEXT, from_addr TEXT, to_addr TEXT, cc TEXT, subject TEXT, body_text TEXT,
 received_at TEXT, is_read INTEGER DEFAULT 0, phone TEXT, customer_id INTEGER,
 has_attachment INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS email_attachments(
 id INTEGER PRIMARY KEY AUTOINCREMENT, email_id INTEGER NOT NULL, file_name TEXT, file_size INTEGER,
 content_type TEXT, blob BLOB, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(email_id) REFERENCES emails(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS backups(
 id INTEGER PRIMARY KEY AUTOINCREMENT, file_name TEXT UNIQUE NOT NULL, size INTEGER DEFAULT 0,
 kind TEXT DEFAULT 'manual', note TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_import_files_sha256 ON import_files(sha256);
CREATE INDEX IF NOT EXISTS idx_imported_rows_description ON imported_quote_rows(description);
CREATE INDEX IF NOT EXISTS idx_scan_sha ON import_scan_files(sha256);
CREATE INDEX IF NOT EXISTS idx_emails_received ON emails(received_at);
CREATE INDEX IF NOT EXISTS idx_emails_customer ON emails(customer_id);
CREATE INDEX IF NOT EXISTS idx_qv_quotation ON quotation_versions(quotation_id);
CREATE INDEX IF NOT EXISTS idx_products_model ON products(model);
'''

# 兼容列：存量库需要补齐时使用(重复执行被 except 吞掉)
COMPAT_COLS = {
    'projects': [('status', "TEXT DEFAULT '报价中'"), ('modified_at', 'TEXT')],
    'products': [('led_count', 'TEXT'), ('pixel_count', 'TEXT'), ('cct', 'TEXT'), ('category', 'TEXT'),
                 ('body_color', 'TEXT'), ('hs_code', 'TEXT'), ('currency', 'TEXT'), ('moq', 'TEXT'),
                 ('trade_terms', 'TEXT'), ("spec_json", "TEXT DEFAULT '{}'")],
    'quotations': [('provider_id', 'INTEGER'), ('expiry_date', 'TEXT'), ('reviewed_at', 'TEXT')],
    'quotation_history': [('provider_id', 'INTEGER'), ('expiry_date', 'TEXT'),
                          ('source_type', "TEXT DEFAULT '手动创建'"), ('source_file', 'TEXT')],
    'customers': [('address', 'TEXT'), ('phone', 'TEXT')],
    'import_files': [('doc_type', "TEXT DEFAULT 'quotation'")],
    'import_scan_files': [('doc_type', "TEXT DEFAULT 'quotation'"), ('customer_contact', 'TEXT'),
                          ('customer_address', 'TEXT'), ('customer_phone', 'TEXT')],
}


def ensure_schema():
    C.ensure_dirs()
    with DB_LOCK:
        c = conn()
        try:
            c.executescript(DDL)
            for table, cols in COMPAT_COLS.items():
                for col, typ in cols:
                    try:
                        c.execute('ALTER TABLE %s ADD COLUMN %s %s' % (table, col, typ))
                    except Exception:
                        pass
            c.execute("UPDATE projects SET status='报价中' WHERE status IS NULL OR status=''")
            c.execute("UPDATE projects SET modified_at=COALESCE(modified_at,updated_at,created_at,CURRENT_TIMESTAMP)")
            c.execute("UPDATE quotation_history SET source_type='导入' WHERE source_type IS NULL OR source_type=''")
            c.execute("INSERT OR IGNORE INTO providers(provider_code,provider_name,provider_info) VALUES (?,?,?)",
                      ('P001', 'SHENZHEN CREATIVE MEDIA TECHNOLOGY CO., LTD',
                       'Add: 1301-F13, Qihang Building, Matian street, Guangming New District, Shenzhen, China. '
                       'T: 0086-0755 2319 6057 | Email: chris@creativemedia-led.com | M: +86 13760258981'))
            c.commit()
        finally:
            c.close()
