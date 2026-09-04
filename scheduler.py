# -*- coding: utf-8 -*-
"""后台调度器(V5)：邮件定时拉取/轮询 + 每周自动备份(时间戳命名)。
零框架：一个守护线程每 20s 检查一次。
"""
import threading
import time
from datetime import datetime

import config as C

BACKUP_INTERVAL_DAYS = 7


def _now_hms():
    return datetime.now().strftime('%H:%M')


def _today():
    return datetime.now().strftime('%Y-%m-%d')


class Scheduler:
    def __init__(self):
        self._stop = False
        self._last_run = {}      # task -> date(day) 防止每日任务重复
        self._last_poll = 0.0    # 邮件轮询时间戳
        self._last_backup_check = 0.0
        self._busy = set()
        self._lock = threading.Lock()
        self._thread = threading.Thread(target=self._loop, daemon=True, name='scheduler')

    def start(self):
        self._thread.start()

    def stop(self):
        self._stop = True

    def _try(self, task, fn, force=False):
        key = (task, _today())
        with self._lock:
            if not force and self._last_run.get(key):
                return
            if task in self._busy:
                return
            self._busy.add(task)
            self._last_run[key] = True
        try:
            fn()
        except Exception as e:
            print('[scheduler] %s 失败: %s' % (task, e))
        finally:
            self._busy.discard(task)

    def _loop(self):
        while not self._stop:
            now = _now_hms()
            # 邮件：配置了账号才轮询/定时拉取(轮询间隔秒,0关闭)
            interval = C.get_int('mail_poll_seconds', 0)
            if interval > 0 and (time.time() - self._last_poll) >= interval:
                self._last_poll = time.time()
                self._poll_mail()
            t = C.get_cfg('mail_fetch_time') or '03:00'
            if t == now:
                self._try('mail_daily', self._poll_mail)
            # 每周自动备份：启动即检查一次，之后每 30 分钟检查一次
            if time.time() - self._last_backup_check >= 1800:
                self._last_backup_check = time.time()
                self._try('backup_weekly', self._backup_if_due)
            time.sleep(20)

    def _poll_mail(self):
        from services import mail_svc
        if not mail_svc.config_ok():
            return
        try:
            r = mail_svc.fetch_unread()
            print('[mail] %s' % r)
        except Exception as e:
            print('[mail] 失败: %s' % e)

    def _backup_if_due(self):
        """需求：数据量不大，每周自动备份一次，按时间戳命名。"""
        from db import query_one
        from services import backup_svc
        try:
            interval = max(1, C.get_int('backup_interval_days', BACKUP_INTERVAL_DAYS))
            row = query_one('SELECT created_at FROM backups ORDER BY id DESC LIMIT 1')
            if row:
                last = str(row['created_at'] or '')[:19]
                due = True
                try:
                    from datetime import datetime as dt
                    delta = dt.now() - dt.strptime(last, '%Y-%m-%d %H:%M:%S')
                    due = delta.days >= interval
                except Exception:
                    due = True
            else:
                due = True   # 首次启动无任何备份 → 立即备份一次
            if due:
                r = backup_svc.run_backup('auto', '每周自动备份')
                print('[backup] 自动备份完成: %s' % r.get('file_name'))
        except Exception as e:
            print('[backup] 失败: %s' % e)


def start():
    s = Scheduler()
    s.start()
    return s
