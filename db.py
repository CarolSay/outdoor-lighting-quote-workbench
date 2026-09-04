# -*- coding: utf-8 -*-
"""工作台 2.0 —— 数据库连接/事务/查询助手/活动日志"""
import sqlite3
import threading
from config import DB

DB_LOCK = threading.RLock()


def conn():
    c = sqlite3.connect(DB, timeout=30, check_same_thread=False)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    c.execute('PRAGMA busy_timeout=30000')
    c.execute('PRAGMA journal_mode=WAL')
    c.execute('PRAGMA synchronous=NORMAL')
    return c


def tx(fn):
    """串行写事务：fn(c) 内执行写操作，自动 commit/rollback。
    fn 返回 sqlite3.Cursor 时自动收敛为 lastrowid，保证调用方可直接拿到插入行号。"""
    with DB_LOCK:
        c = conn()
        try:
            r = fn(c)
            c.commit()
            if isinstance(r, sqlite3.Cursor):
                return r.lastrowid
            return r
        except Exception:
            c.rollback()
            raise
        finally:
            c.close()


def query_all(sql, args=()):
    c = conn()
    try:
        return [dict(x) for x in c.execute(sql, args).fetchall()]
    finally:
        c.close()


def query_one(sql, args=()):
    c = conn()
    try:
        r = c.execute(sql, args).fetchone()
        return dict(r) if r else None
    finally:
        c.close()


def execute(sql, args=()):
    return tx(lambda c: c.execute(sql, args).lastrowid)


def log(entity_type, entity_id, action, detail=''):
    try:
        tx(lambda c: c.execute(
            'INSERT INTO activity_log(entity_type,entity_id,action,detail) VALUES (?,?,?,?)',
            (entity_type, entity_id or 0, action, detail)))
    except Exception:
        pass


def get_count(sql, args=()):
    c = conn()
    try:
        return c.execute(sql, args).fetchone()[0]
    finally:
        c.close()
