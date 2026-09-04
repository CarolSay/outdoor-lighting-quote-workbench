# -*- coding: utf-8 -*-
"""邮件路由(V5)：收发件 + 页内配置弹窗(需求2)"""
from services import mail_svc
from db import query_one, log

MAIL_CONFIG_KEYS = ['mail_smtp_host', 'mail_smtp_port', 'mail_imap_host', 'mail_imap_port',
                    'mail_user', 'mail_auth_code']


def routes():
    return [
        ('GET', r'/api/mail/summary', h_summary),
        ('GET', r'/api/mail/config', h_config_get),
        ('PUT', r'/api/mail/config', h_config_put),
        ('GET', r'/api/mail/list', h_list),
        ('GET', r'/api/mail/detail', h_detail),
        ('GET', r'/api/mail/(?P<id>\d+)/attachment/(?P<aid>\d+)', h_attachment),
        ('POST', r'/api/mail/sync', h_sync),
        ('POST', r'/api/mail/(?P<id>\d+)/convert', h_convert),
        ('POST', r'/api/mail/(?P<id>\d+)/relate', h_relate),
        ('POST', r'/api/mail/(?P<id>\d+)/reply', h_reply),
    ]


def h_summary(p, q, b, http):
    return mail_svc.summary()


def h_config_get(p, q, b, http):
    """邮件配置：授权码不回显，只返回是否已设置。"""
    from db import query_all
    rows = {r['key']: r['value'] for r in query_all(
        'SELECT key,value FROM config WHERE key IN (%s)' % ','.join('?' * len(MAIL_CONFIG_KEYS)),
        MAIL_CONFIG_KEYS)}
    out = {}
    for k in MAIL_CONFIG_KEYS:
        secret = k in ('mail_auth_code',)
        v = rows.get(k) or ''
        out[k] = {'has_value': bool(v), 'value': ('******' if secret and v else v), 'secret': secret}
    return {'config': out}


def h_config_put(p, q, b, http):
    import config as C
    changed = {k: v for k, v in (b or {}).items() if k in MAIL_CONFIG_KEYS}
    for k in changed:
        if k == 'mail_auth_code' and str(changed[k]).strip() and set(str(changed[k])) <= {'*'}:
            changed[k] = C.get_cfg(k)   # 掩码不覆盖原值
    C.set_cfg_many(changed)
    log('config', 0, 'mail_config', '更新邮件配置 %d 项' % len(changed))
    return {'ok': True, 'updated': list(changed.keys())}


def h_list(p, q, b, http):
    limit = int(q.get('limit', '100'))
    return {'mails': mail_svc.list_mails(limit)}


def h_detail(p, q, b, http):
    eid = int(q.get('id', '0'))
    row = mail_svc.detail(eid)
    if not row:
        return http.send_json({'error': '邮件不存在'}, 404)
    return row


def h_attachment(p, q, b, http):
    aid = int(p['aid'])
    att = query_one('SELECT * FROM email_attachments WHERE id=?', (aid,))
    if not att or not att['blob']:
        return http.send_json({'error': '附件不存在或已超限未保存'}, 404)
    return http.send_blob(att['file_name'] or 'attachment.bin', att['blob'],
                          att['content_type'] or 'application/octet-stream')


def h_sync(p, q, b, http):
    try:
        return mail_svc.fetch_unread()
    except mail_svc.MailError as e:
        return http.send_json({'error': str(e)}, 400)
    except Exception as e:
        return http.send_json({'error': '同步异常：%s' % e}, 500)


def h_convert(p, q, b, http):
    return mail_svc.convert_to_customer(int(p['id']))


def h_relate(p, q, b, http):
    return mail_svc.relate_customer(int(p['id']), b.get('customer_id'))


def h_reply(p, q, b, http):
    try:
        return mail_svc.send_reply(int(p['id']), b.get('content', ''))
    except mail_svc.MailError as e:
        return http.send_json({'error': str(e)}, 400)
