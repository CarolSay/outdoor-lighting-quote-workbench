# -*- coding: utf-8 -*-
"""路由注册器。每个路由模块导出 routes() -> [(method, regex_str, handler), ...]。
handler(params:dict, query:dict, body:dict, http) -> dict|list 由 http.send_json 返回；
或调用 http.send_file(path) / http.send_json 自行返回。
"""
import re

ALL = []


def collect(mods):
    ALL.clear()
    for m in mods:
        for method, pattern, handler in m.routes():
            ALL.append((method, re.compile('^' + pattern + '$'), handler))
    return ALL


def match(method, path):
    for m, rx, h in ALL:
        if method != m:
            continue
        g = rx.match(path)
        if g:
            return h, g.groupdict()
    return None, None
