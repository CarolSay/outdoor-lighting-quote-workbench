# -*- coding: utf-8 -*-
"""报价工作台 V5(精简版) —— 入口
模块化后端：schema/db/config/scheduler + services/* + routes/*
启动：python app.py  → http://127.0.0.1:5100
"""
import json
import mimetypes
import os
import traceback
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

import config as C
import schema
import routes as router
import importlib

C.ensure_dirs()
schema.ensure_schema()

MODULES = [
    'routes.core', 'routes.config_routes', 'routes.mail_routes',
    'routes.backup_routes',
]


def _load_handlers():
    mods = []
    for name in MODULES:
        mods.append(importlib.import_module(name))
    router.collect(mods)


_load_handlers()


def _ctype(name):
    t = mimetypes.guess_type(name)[0]
    return t or 'application/octet-stream'


def _body(h):
    n = int(h.headers.get('Content-Length', '0'))
    raw = h.rfile.read(n) or b'{}'
    try:
        return json.loads(raw.decode('utf-8') or '{}')
    except Exception:
        return {}


def _query_of(url):
    return {k: v[0] for k, v in parse_qs(url.query).items()}


class H(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def _cors(self):
        pass

    def send_json(self, obj, status=200):
        b = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(b)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(b)

    def send_file(self, path, inline=False):
        if not path or not os.path.isfile(path):
            return self.send_json({'error': '文件不存在'}, 404)
        with open(path, 'rb') as f:
            b = f.read()
        name = os.path.basename(path)
        disp = 'inline' if inline else 'attachment'
        self.send_response(200)
        self.send_header('Content-Type', _ctype(path) + ('; charset=utf-8' if _ctype(path).startswith('text') else ''))
        from urllib.parse import quote
        self.send_header('Content-Disposition', "%s; filename=\"%s\"; filename*=UTF-8''%s" % (disp, name, quote(name)))
        self.send_header('Content-Length', str(len(b)))
        self.send_header('Cache-Control', 'no-store')  # 静态页/资产禁缓存，避免前端改动不生效
        self.end_headers()
        self.wfile.write(b)

    def send_blob(self, name, blob, ctype='application/octet-stream'):
        from urllib.parse import quote
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Disposition',
                         "attachment; filename=\"%s\"; filename*=UTF-8''%s" % (name, quote(name)))
        self.send_header('Content-Length', str(len(blob)))
        self.end_headers()
        self.wfile.write(blob)

    def _static(self, p):
        if p == '/':
            return self.send_file(os.path.join(C.STATIC, 'index.html'), inline=True)
        rel = p.lstrip('/')
        full = os.path.normpath(os.path.join(C.STATIC, rel))
        if not full.startswith(os.path.normpath(C.STATIC)) or not os.path.isfile(full):
            return self.send_json({'error': 'Not found'}, 404)
        return self.send_file(full, inline=True)

    def _dispatch(self, method, url):
        h, params = router.match(method, url.path)
        if not h:
            if method == 'GET':
                return self._static(url.path)
            return self.send_json({'error': 'Not found'}, 404)
        try:
            body = {} if method == 'GET' else _body(self)
            out = h(params, _query_of(url), body, self)
            if out is not None:
                self.send_json(out)
        except Exception as e:
            traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    def _run(self, method):
        try:
            self._dispatch(method, urlparse(self.path))
        except (ConnectionError, BrokenPipeError):
            pass  # 客户端提前断开(刷新/超时取消)，静默即可
        except Exception as e:
            traceback.print_exc()
            try:
                self.send_json({'error': str(e)}, 500)
            except Exception:
                pass

    def do_GET(self):
        self._run('GET')

    def do_POST(self):
        self._run('POST')

    def do_PUT(self):
        self._run('PUT')

    def do_DELETE(self):
        self._run('DELETE')

    def log_message(self, *a):
        pass


def main():
    import scheduler
    s = scheduler.start()
    server = ThreadingHTTPServer((C.HOST, C.PORT), H)
    print('=' * 60)
    print('  户外照明报价工作台 V5(精简版)')
    print('  打开: http://%s:%s' % (C.HOST, C.PORT))
    print('  数据库:', C.DB)
    print('  邮件配置: 邮件页 → ⚙️ 设置')
    print('=' * 60)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n退出中...')
    finally:
        s.stop()
        server.server_close()


if __name__ == '__main__':
    main()
