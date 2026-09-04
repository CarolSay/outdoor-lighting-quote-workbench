# -*- coding: utf-8 -*-
"""报价工作台 V5(精简版) —— 全局配置：路径、常量、KV 配置表读写"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE, 'outdoor_lighting.db')
TEMPLATE = os.path.join(BASE, 'quotation_template.xlsx')
STATIC = os.path.join(BASE, 'templates')
DATA = os.path.join(BASE, 'data')            # 备份/导出 根目录
BACKUP_DIR = os.path.join(DATA, 'backups')

PORT = int(os.environ.get('PORT', '5100'))
HOST = os.environ.get('HOST', '127.0.0.1')

CN_PHONE_RE = r'(?<!\d)1[3-9]\d{9}(?!\d)'

# 可配置项：key -> (默认值, 分组, 标签, 是否敏感)
# 精简版仅保留 邮件 + 备份 两组；邮件配置在「邮件→设置」弹窗中维护
CONFIG_META = {
    # 邮件
    'mail_imap_host': ('imap.qq.com', 'mail', 'IMAP 服务器', 0),
    'mail_imap_port': ('993', 'mail', 'IMAP 端口', 0),
    'mail_smtp_host': ('smtp.qq.com', 'mail', 'SMTP 服务器', 0),
    'mail_smtp_port': ('465', 'mail', 'SMTP 端口', 0),
    'mail_user': ('', 'mail', '邮箱账号', 0),
    'mail_auth_code': ('', 'mail', '授权码', 1),
    'mail_poll_seconds': ('0', 'mail', '轮询间隔秒(0=关闭, 建议60+)', 0),
    'mail_fetch_time': ('03:00', 'mail', '每日定时拉取时间', 0),
    # 备份
    'backup_dir': (BACKUP_DIR, 'backup', 'DB备份目录', 0),
    'backup_retention': ('14', 'backup', '备份保留份数', 0),
    'backup_interval_days': ('7', 'backup', '自动备份间隔(天)', 0),
    # 项目
    'project_statuses': ('报价中,样品确认,订单确认,项目终止,项目失败', 'project', '项目状态列表(逗号分隔)', 0),
}
SECRET_KEYS = {k for k, v in CONFIG_META.items() if v[3] == 1}


def defaults():
    return {k: v[0] for k, v in CONFIG_META.items()}


def env_or_default(key, dflt=''):
    """读取环境变量覆盖(仅支持少数常用键)。"""
    m = {'mail_user': 'MAIL_USER', 'mail_auth_code': 'MAIL_AUTH_CODE'}
    if key in m and os.environ.get(m[key]):
        return os.environ[m[key]]
    return dflt


def ensure_dirs():
    for d in (DATA, BACKUP_DIR):
        try:
            os.makedirs(d, exist_ok=True)
        except Exception:
            pass


def get_cfg(key):
    """取配置：默认值(支持环境变量覆盖) -> 库中覆盖值。返回字符串。"""
    from db import query_one
    dflt = CONFIG_META.get(key, (None, '', key, 0))[0]
    val = env_or_default(key, dflt)
    if val is None:
        val = ''
    r = query_one('SELECT value FROM config WHERE key=?', (key,))
    if r is not None and r['value'] not in (None, ''):
        return r['value']
    return '' if val is None else str(val)


def get_int(key, dflt=0):
    try:
        return int(float(get_cfg(key) or dflt))
    except Exception:
        return dflt


def get_bool(key):
    return str(get_cfg(key)).strip() in ('1', 'true', 'yes', 'on')


def all_cfg():
    from db import query_all
    merged = defaults()
    for row in query_all('SELECT key,value FROM config'):
        merged[row['key']] = row['value']
    return merged


def set_cfg(key, value):
    from db import tx
    # 注意：Web 配置页写入前已在路由层按 CONFIG_META 白名单过滤；
    # 这里允许任意 key，供运行时状态(mail_last_sync/wechat_last_scan)持久化使用。
    tx(lambda c: c.execute(
        'INSERT INTO config(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) '
        'ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP',
        (key, str(value or ''))))


def set_cfg_many(items):
    for k, v in items.items():
        set_cfg(k, v)


def get_statuses():
    """从 config 表读取项目状态列表，逗号分隔。"""
    val = get_cfg('project_statuses') or '报价中,样品确认,订单确认,项目终止,项目失败'
    return [s.strip() for s in val.split(',') if s.strip()]
