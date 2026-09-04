# -*- coding: utf-8 -*-
"""备份路由"""
from services import backup_svc
from db import log


def routes():
    return [
        ('POST', r'/api/backup/run', h_run),
        ('GET', r'/api/backups', h_list),
        ('DELETE', r'/api/backups/(?P<id>\d+)', h_delete),
        ('GET', r'/api/backups/(?P<id>\d+)/download', h_download),
    ]


def h_run(p, q, b, http):
    res = backup_svc.run_backup('manual', b.get('note', ''))
    log('backup', res['id'], 'run', res['file_name'])
    return res


def h_list(p, q, b, http):
    return {'backups': backup_svc.list_backups()}


def h_delete(p, q, b, http):
    return backup_svc.delete_backup(int(p['id']))


def h_download(p, q, b, http):
    path = backup_svc.backup_path(int(p['id']))
    if not path:
        return http.send_json({'error': '备份文件不存在'}, 404)
    return http.send_file(path)
