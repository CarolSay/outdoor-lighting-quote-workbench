# -*- coding: utf-8 -*-
"""邮件模块(V5)：IMAP 收取未读 / 智能客户识别 / 一键转客户 / SMTP 回复。
接入 Foxmail/QQ 邮箱（imap.qq.com / smtp.qq.com），账号密码走 config 表 + 环境变量，不硬编码。
配置入口：邮件页 → 设置弹窗(需求2)。
"""
import email
import imaplib
import re
import smtplib
import ssl
import time
from email.header import decode_header
from email.utils import parsedate_to_datetime

import config as C
from db import tx, query_all, query_one, log


class MailError(Exception):
    pass


def _decode(s):
    if not s:
        return ''
    out = []
    for part, enc in decode_header(s):
        if isinstance(part, bytes):
            try:
                out.append(part.decode(enc or 'utf-8', errors='ignore'))
            except Exception:
                out.append(part.decode('utf-8', errors='ignore'))
        else:
            out.append(part)
    return ''.join(out).strip()


def _strip_html(html):
    text = re.sub(r'<br\s*/?>', '\n', html, flags=re.I)
    text = re.sub(r'</(p|div|tr|li)>', '\n', text, flags=re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&nbsp;?', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n+', '\n', text)
    return text.strip()


def _body_text(msg):
    if msg.is_multipart():
        plain, html = '', ''
        for part in msg.walk():
            ctype = part.get_content_type()
            if ctype == 'text/plain':
                try:
                    plain += part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8',
                                                                  errors='ignore')
                except Exception:
                    pass
            elif ctype == 'text/html' and not html:
                try:
                    html = part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8',
                                                                errors='ignore')
                except Exception:
                    pass
        return (plain or _strip_html(html)).strip()
    try:
        return msg.get_payload(decode=True).decode(msg.get_content_charset() or 'utf-8', errors='ignore').strip()
    except Exception:
        return ''


def _attachments(msg):
    atts = []
    for part in msg.walk():
        if part.get_content_maintype() == 'multipart':
            continue
        fn = part.get_filename()
        if not fn:
            continue
        fn = _decode(fn)
        payload = part.get_payload(decode=True) or b''
        atts.append({'file_name': fn, 'content_type': part.get_content_type(),
                     'size': len(payload), 'blob': payload if len(payload) <= 20 * 1024 * 1024 else None})
    return atts


def _imap():
    host = C.get_cfg('mail_imap_host') or 'imap.qq.com'
    port = C.get_int('mail_imap_port', 993)
    user = C.get_cfg('mail_user')
    auth = C.get_cfg('mail_auth_code')
    if not user or not auth:
        raise MailError('未配置邮箱账号/授权码：请在 邮件→设置 中填写')
    try:
        m = imaplib.IMAP4_SSL(host, port)
        m.login(user, auth)
    except imaplib.IMAP4.error as e:
        raise MailError('邮箱登录失败(%s:%s)：%s。QQ邮箱请用“授权码”而非登录密码' % (host, port, e))
    except Exception as e:
        raise MailError('无法连接邮件服务器 %s:%s：%s' % (host, port, e))
    return m


def config_ok():
    return bool(C.get_cfg('mail_user')) and bool(C.get_cfg('mail_auth_code'))


def _normalize_phone(phone):
    return re.sub(r'[\s\-()]', '', phone or '')


def _find_customer_by_phone(phone):
    if not phone:
        return None
    p = _normalize_phone(phone)
    if not p:
        return None
    for row in query_all("SELECT id,company,whatsapp_phone,contact FROM customers WHERE active=1"):
        joined = ' '.join([row.get('whatsapp_phone') or '', row.get('contact') or ''])
        if p in _normalize_phone(joined) or p in joined.replace(' ', ''):
            return row
    return None


def _find_customer_by_email(addr):
    if not addr:
        return None
    return query_one('SELECT * FROM customers WHERE active=1 AND lower(email)=lower(?) LIMIT 1',
                     (addr.strip(),)) or None


def _mail_parts(msg):
    subject = _decode(msg.get('Subject'))
    from_raw = msg.get('From') or ''
    m = re.match(r'^(.*?)\s*<([^>]+)>', from_raw)
    if m:
        from_name, from_addr = _decode(m.group(1)), m.group(2).strip()
    else:
        from_name, from_addr = '', from_raw.strip()
    to_addr = _decode(msg.get('To'))
    cc = _decode(msg.get('Cc'))
    date = ''
    try:
        dt = parsedate_to_datetime(msg.get('Date'))
        date = dt.strftime('%Y-%m-%d %H:%M:%S')
    except Exception:
        date = msg.get('Date') or ''
    body = _body_text(msg)[:8000]
    return subject, from_name, from_addr, to_addr, cc, date, body


def _store_mail(c, msg, uid):
    subject, from_name, from_addr, to_addr, cc, date, body = _mail_parts(msg)
    mid = msg.get('Message-ID') or ('%s:%s' % (from_addr, uid))
    mid = mid.strip().strip('<>') or ('n/a-%s-%s' % (int(time.time()), uid))
    exist = c.execute('SELECT id FROM emails WHERE message_id=?', (mid,)).fetchone()
    if exist:
        return None
    phone = ''
    m = re.search(C.CN_PHONE_RE, body or subject or '')
    if m:
        phone = m.group(0)
    cust = _find_customer_by_phone(phone) or _find_customer_by_email(from_addr)
    cust_id = cust['id'] if cust else None
    atts = _attachments(msg)
    eid = c.execute('INSERT INTO emails(mailbox,uid,message_id,from_name,from_addr,to_addr,cc,subject,body_text,'
                    'received_at,is_read,phone,customer_id,has_attachment) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    ('INBOX', uid, mid, from_name, from_addr, to_addr, cc, subject, body, date, 0, phone,
                     cust_id, 1 if atts else 0)).lastrowid
    for a in atts:
        c.execute('INSERT INTO email_attachments(email_id,file_name,file_size,content_type,blob) VALUES (?,?,?,?,?)',
                  (eid, a['file_name'], a['size'], a['content_type'], a['blob']))
    return {'id': eid, 'customer_id': cust_id, 'phone': phone, 'subject': subject, 'from_addr': from_addr}


def fetch_unread():
    """连接 IMAP 拉取未读，解析入库并标记已读。返回 {fetched,new,duplicates}。"""
    if not config_ok():
        raise MailError('未配置邮箱账号/授权码，请在 邮件→设置 中填写')
    m = _imap()
    try:
        typ, _ = m.select('INBOX', readonly=False)
        if typ != 'OK':
            raise MailError('无法打开收件箱')
        typ, data = m.search(None, 'UNSEEN')
        if typ != 'OK':
            raise MailError('搜索未读邮件失败')
        ids = data[0].split()
        fetched = len(ids)
        new, dup = 0, 0
        for num in ids:
            try:
                typ, msgdata = m.fetch(num, '(RFC822)')
                raw = msgdata[0][1]
                msg = email.message_from_bytes(raw)
                info = _store_mail_wrap(msg, num)
            except Exception:
                info = None
            if info:
                new += 1
            else:
                dup += 1
            try:
                m.store(num, '+FLAGS', '\\Seen')
            except Exception:
                pass
        C.set_cfg('mail_last_sync', time.strftime('%Y-%m-%d %H:%M:%S'))
        return {'ok': True, 'fetched': fetched, 'new': new, 'duplicates': dup}
    finally:
        try:
            m.logout()
        except Exception:
            pass


def _store_mail_wrap(msg, uid):
    return tx(lambda c: _store_mail(c, msg, uid))


def detail(email_id):
    e = query_one('SELECT * FROM emails WHERE id=?', (email_id,))
    if not e:
        return None
    tx(lambda c: c.execute('UPDATE emails SET is_read=1 WHERE id=?', (email_id,)))
    e['attachments'] = query_all('SELECT id,email_id,file_name,file_size,content_type FROM email_attachments '
                                 'WHERE email_id=?', (email_id,))
    if e.get('customer_id'):
        e['customer'] = query_one('SELECT id,company,contact,email,whatsapp_phone FROM customers '
                                  'WHERE id=?', (e['customer_id'],))
    return e


def list_mails(limit=100):
    return query_all('SELECT id,from_name,from_addr,subject,received_at,is_read,phone,customer_id,has_attachment '
                     'FROM emails ORDER BY received_at DESC,id DESC LIMIT ?', (limit,))


def summary():
    unread = query_one('SELECT COUNT(*) n FROM emails WHERE is_read=0')['n']
    total = query_one('SELECT COUNT(*) n FROM emails')['n']
    return {'unread': unread, 'total': total, 'configured': config_ok(),
            'last_sync': C.get_cfg('mail_last_sync') or ''}


def relate_customer(email_id, customer_id):
    e = query_one('SELECT * FROM emails WHERE id=?', (email_id,))
    if not e:
        return {'error': '邮件不存在'}
    tx(lambda c: c.execute('UPDATE emails SET customer_id=? WHERE id=?', (customer_id or None, email_id)))
    return {'ok': True}


def convert_to_customer(email_id):
    """发件人邮箱→客户邮箱；正文手机号→客户手机；发件人姓名/主题→客户姓名/公司名"""
    e = query_one('SELECT * FROM emails WHERE id=?', (email_id,))
    if not e:
        return {'error': '邮件不存在'}
    if not e.get('phone'):
        return {'error': '未在正文中识别到 11 位手机号，无法转客户'}
    phone = e['phone']
    exist = _find_customer_by_phone(phone)
    if exist:
        tx(lambda c: c.execute('UPDATE emails SET customer_id=? WHERE id=?', (exist['id'], email_id)))
        return {'ok': True, 'customer_id': exist['id'], 'company': exist['company'], 'exists': True}
    name = e['from_name'] or re.sub(r'^Re:\s*', '', e['subject'] or '') or 'Imported Customer'
    company = name[:80]
    code = 'CM-' + phone
    existing_code = query_one('SELECT id FROM customers WHERE customer_code=?', (code,))

    def f(c):
        if existing_code:
            cid = existing_code['id']
        else:
            cur = c.execute('INSERT INTO customers(customer_code,company,country,contact,email,whatsapp_phone,'
                            'currency,incoterm,payment_terms,active) VALUES (?,?,?,?,?,?,?,?,?,1)',
                            (code, company, '', name, e['from_addr'], phone, 'USD', 'EXW', ''))
            cid = cur.lastrowid
        c.execute('UPDATE emails SET customer_id=? WHERE id=?', (cid, email_id))
        return cid
    cid = tx(f)
    log('customer', cid, 'create', 'from email#%s %s' % (email_id, company))
    return {'ok': True, 'customer_id': cid, 'company': company, 'exists': False}


def send_reply(email_id, content):
    e = query_one('SELECT * FROM emails WHERE id=?', (email_id,))
    if not e:
        return {'error': '邮件不存在'}
    if not (content or '').strip():
        return {'error': '回复内容不能为空'}
    host = C.get_cfg('mail_smtp_host') or 'smtp.qq.com'
    port = C.get_int('mail_smtp_port', 465)
    user = C.get_cfg('mail_user')
    auth = C.get_cfg('mail_auth_code')
    if not user or not auth:
        raise MailError('未配置邮箱账号/授权码，请在 邮件→设置 中填写')
    msg = email.message.EmailMessage()
    msg['From'] = user
    msg['To'] = e['from_addr']
    msg['Subject'] = 'Re: ' + (e['subject'] or '')
    if e.get('message_id'):
        msg['In-Reply-To'] = '<%s>' % e['message_id']
        msg['References'] = '<%s>' % e['message_id']
    msg.set_content(content)
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with smtplib.SMTP_SSL(host, port, timeout=30, context=ctx) as s:
            s.login(user, auth)
            s.send_message(msg)
    except smtplib.SMTPAuthenticationError as e2:
        raise MailError('SMTP 登录失败：%s（检查授权码）' % e2)
    except Exception as e2:
        raise MailError('发送失败(%s:%s)：%s' % (host, port, e2))
    tx(lambda c: c.execute('UPDATE emails SET is_read=1 WHERE id=?', (email_id,)))
    log('email', email_id, 'reply', 'to ' + e['from_addr'])
    return {'ok': True}


def send_new(to, content, cc='', subject='From CM Quote Workbench'):
    """发送新邮件（非回复），用于主动联系客户。"""
    if not (to or '').strip():
        raise MailError('收件人不能为空')
    if not (content or '').strip():
        raise MailError('邮件内容不能为空')
    host = C.get_cfg('mail_smtp_host') or 'smtp.163.com'
    port = C.get_int('mail_smtp_port', 465)
    user = C.get_cfg('mail_user')
    auth = C.get_cfg('mail_auth_code')
    if not user or not auth:
        raise MailError('未配置邮箱账号/授权码，请在 邮件→设置 中填写')
    msg = email.message.EmailMessage()
    msg['From'] = user
    msg['To'] = to
    if cc:
        msg['Cc'] = cc
    msg['Subject'] = subject
    msg.set_content(content)
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with smtplib.SMTP_SSL(host, port, timeout=30, context=ctx) as s:
            s.login(user, auth)
            s.send_message(msg)
    except smtplib.SMTPAuthenticationError as e2:
        raise MailError('SMTP 登录失败：%s（检查授权码）' % e2)
    except Exception as e2:
        raise MailError('发送失败(%s:%s)：%s' % (host, port, e2))
    recipients = to + (',' + cc if cc else '')
    log('email', 0, 'send', 'to ' + recipients)
    return {'ok': True, 'to': to, 'cc': cc}
