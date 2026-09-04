# -*- coding: utf-8 -*-
"""系统 KV 配置路由(V5)：供邮件设置弹窗等读写 config 表"""
import config as C
from db import log


def routes():
    return [
        ('GET', r'/api/config', h_config_get),
        ('PUT', r'/api/config', h_config_put),
    ]


def h_config_get(p, q, b, http):
    vals = C.all_cfg()
    out = {}
    for key, (default, group, label, secret) in C.CONFIG_META.items():
        out.setdefault(group, []).append({
            'key': key, 'label': label, 'value': '******' if secret and vals.get(key) else (vals.get(key) or ''),
            'secret': bool(secret), 'has_value': bool(vals.get(key))})
    return {'groups': out}


def h_config_put(p, q, b, http):
    items = b if isinstance(b, dict) else {}
    allowed = C.CONFIG_META
    changed = {k: v for k, v in items.items() if k in allowed}
    for k in changed:
        # 全星号掩码串(******)不改动原值
        if k in C.SECRET_KEYS and str(changed[k]).strip() and set(str(changed[k])) <= {'*'}:
            changed[k] = C.get_cfg(k)
    C.set_cfg_many(changed)
    log('config', 0, 'update', '修改配置 %d 项' % len(changed))
    return {'ok': True, 'updated': list(changed.keys())}
