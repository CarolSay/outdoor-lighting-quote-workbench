# -*- coding: utf-8 -*-
"""DB 备份：SQLite online backup API，保留最近 N 份，可下载。定时由 scheduler 调用。"""
import os
import sqlite3
import time

import config as C
from db import tx, query_all, query_one


def run_backup(kind='manual', note=''):
    C.ensure_dirs()
    os.makedirs(C.get_cfg('backup_dir'), exist_ok=True)
    name = 'backup_%s_%s.db' % (time.strftime('%Y%m%d_%H%M%S'), kind)
    target = os.path.join(C.get_cfg('backup_dir'), name)
    src = sqlite3.connect(C.DB)
    try:
        dst = sqlite3.connect(target)
        try:
            src.backup(dst)
        finally:
            dst.close()
    finally:
        src.close()
    size = os.path.getsize(target)
    bid = tx(lambda c: c.execute('INSERT INTO backups(file_name,size,kind,note) VALUES (?,?,?,?)',
                                 (name, size, kind, note or '')).lastrowid)
    prune()
    return {'ok': True, 'id': bid, 'file_name': name, 'size': size}


def prune():
    keep = max(1, C.get_int('backup_retention', 14))
    rows = query_all('SELECT id,file_name FROM backups ORDER BY id DESC')
    for r in rows[keep:]:
        try:
            p = os.path.join(C.get_cfg('backup_dir'), r['file_name'])
            if os.path.exists(p):
                os.remove(p)
        except Exception:
            pass
        tx(lambda c: c.execute('DELETE FROM backups WHERE id=?', (r['id'],)))


def list_backups():
    rows = query_all('SELECT * FROM backups ORDER BY id DESC LIMIT 100')
    for r in rows:
        p = os.path.join(C.get_cfg('backup_dir'), r['file_name'])
        r['exists'] = os.path.exists(p)
    return rows


def delete_backup(bid):
    r = query_one('SELECT * FROM backups WHERE id=?', (bid,))
    if not r:
        return {'error': '备份不存在'}
    try:
        p = os.path.join(C.get_cfg('backup_dir'), r['file_name'])
        if os.path.exists(p):
            os.remove(p)
    except Exception:
        pass
    tx(lambda c: c.execute('DELETE FROM backups WHERE id=?', (bid,)))
    return {'ok': True}


def backup_path(bid):
    r = query_one('SELECT * FROM backups WHERE id=?', (bid,))
    if not r:
        return None
    p = os.path.join(C.get_cfg('backup_dir'), r['file_name'])
    return p if os.path.exists(p) else None
