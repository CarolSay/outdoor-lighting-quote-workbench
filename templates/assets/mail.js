/* 邮件模块页(V5)：收件箱 + 页内配置弹窗(需求2)，无 AI 建议 */
(function () {
  var sel = null;

  var CFG_FIELDS = [
    ['mail_smtp_host', 'SMTP 服务器', 0], ['mail_smtp_port', 'SMTP 端口', 0],
    ['mail_imap_host', 'IMAP 服务器', 0], ['mail_imap_port', 'IMAP 端口', 0],
    ['mail_user', '邮箱账号', 0], ['mail_auth_code', '授权码(密码)', 1]
  ];

  function listHTML(s) {
    var conf = s.configured ? '' : ' <span class="pill warn">邮箱未配置</span>';
    var h = '<div class="toolbar">';
    h += '<button class="btn primary" onclick="V4Mail.sync()">↻ 同步未读邮件</button>';
    h += '<span>未读 <b id="mUnread">' + (s.unread || 0) + '</b> / 共 ' + (s.total || 0) + '</span>' + conf;
    h += '<span class="mini" id="mLast">' + (s.last_sync ? '上次同步：' + V4.dt(s.last_sync) : '') + '</span>';
    h += '<span class="sp"></span>';
    h += '<button class="btn" onclick="V4Mail.openConfig()">⚙️ 邮件设置</button>';
    h += '<button class="btn" onclick="V4Mail.load()">↻ 刷新</button></div>';
    h += '<div class="split"><div class="pane-sm"><div id="mailList">' +
         '<div class="mini">点击“同步未读邮件”拉取新邮件(每日 03:00 自动)。智能识别正文中的 11 位手机号并尝试关联客户。' +
         (s.configured ? '' : '首次使用请先点「⚙️ 邮件设置」配置服务器与授权码。') + '</div>' +
         '</div></div><div class="pane" id="mailDetail"><div class="empty">选择一封邮件查看详情</div></div></div>';
    return h;
  }

  function pill(row) {
    var out = '';
    if (row.phone) out += ' <span class="pill blue">📱' + V4.esc(row.phone) + '</span>';
    if (row.customer_id) out += ' <span class="pill ok">已关联客户</span>';
    if (row.has_attachment) out += ' <span class="pill gray">📎</span>';
    return out;
  }

  function load() {
    V4.api('/api/mail/summary').then(function (s) {
      V4.badge(s.unread || 0);
      V4.el('mailPage').innerHTML = listHTML(s);
      return V4.api('/api/mail/list?limit=100');
    }).then(function (d) {
      var list = V4.el('mailList');
      if (!list) return;
      var mails = d.mails || [];
      if (!mails.length) {
        list.innerHTML = '<div class="empty">收件箱为空。先点“同步未读邮件”，或在邮件设置中配置账号/授权码。</div>';
        return;
      }
      var h = '';
      mails.forEach(function (r) {
        var cls = r.is_read ? 'mail-row' : 'mail-row mail-unread';
        h += '<div class="' + cls + '" onclick="V4Mail.open(' + r.id + ')">';
        h += '<b>' + (r.is_read ? '' : '● ') + V4.esc(r.subject || '(无主题)') + '</b>' + pill(r);
        h += '<div class="mini">' + V4.esc(r.from_name || '') + ' &lt;' + V4.esc(r.from_addr) + '&gt; · ' +
             V4.dt(r.received_at) + '</div></div>';
      });
      list.innerHTML = h;
      if (sel) V4Mail.open(sel);
    });
  }

  function open(id) {
    sel = id;
    V4.api('/api/mail/detail?id=' + id).then(function (e) {
      var box = V4.el('mailDetail');
      if (!box) return;
      var h = '<div class="detail-card">';
      h += '<h3 style="margin:0 0 8px">' + V4.esc(e.subject || '(无主题)') + '</h3>';
      h += '<div class="kv"><b>发件人</b>' + V4.esc(e.from_name || '') + ' &lt;' + V4.esc(e.from_addr) + '&gt;</div>';
      h += '<div class="kv"><b>收件时间</b>' + V4.dt(e.received_at) + '</div>';
      h += '<div class="kv"><b>收件人</b>' + V4.esc(e.to_addr || '') + '</div>';
      if (e.cc) h += '<div class="kv"><b>抄送</b>' + V4.esc(e.cc) + '</div>';
      if (e.customer) h += '<div class="kv"><b>客户</b>' + V4.esc(e.customer.company) + '</div>';
      // 手机号识别区
      if (e.phone) {
        h += '<div class="kv" style="background:#fff8e1;padding:6px 8px;border-radius:6px"><b>识别手机号</b>' +
             V4.esc(e.phone);
        if (!e.customer_id) {
          h += ' <span class="mini">(未匹配客户)</span> ' +
               '<button class="btn primary rowbtn" onclick="V4Mail.convert(' + e.id + ')">➜ 转为客户</button>' +
               '<button class="btn rowbtn" onclick="V4Mail.showRelate(' + e.id + ')">关联已有客户</button>';
        } else {
          h += ' <span class="pill ok">已匹配</span>';
        }
        h += '</div>';
      } else if (!e.customer_id) {
        h += '<button class="btn rowbtn" onclick="V4Mail.showRelate(' + e.id + ')">手动关联客户</button>';
      }
      h += '<div class="kv" style="margin-top:8px"><b>附件</b></div>';
      var atts = e.attachments || [];
      if (atts.length) {
        atts.forEach(function (a) {
          h += '<div class="mini" style="margin-left:8px">📎 ' + V4.esc(a.file_name) + ' (' +
               (a.file_size > 1048576 ? (a.file_size / 1048576).toFixed(1) + 'MB' : Math.ceil(a.file_size / 1024) + 'KB') +
               ') <a href="/api/mail/' + e.id + '/attachment/' + a.id + '">下载</a></div>';
        });
      } else {
        h += '<div class="mini" style="margin-left:8px">无</div>';
      }
      h += '<div style="border-top:1px solid #eef1f5;margin:10px 0"></div>';
      h += '<div style="white-space:pre-wrap;font-size:13px;line-height:1.7">' + V4.esc(e.body_text || '(无正文)') + '</div>';
      h += '</div>';
      // 回复区
      h += '<div class="detail-card"><b>回复邮件</b>(发送至发件人)<br>';
      h += '<textarea id="replyBox" rows="5" style="width:100%;border:1px solid #d5dbe3;border-radius:6px;padding:8px;font-size:13px;margin-top:6px"></textarea>';
      h += '<div class="toolbar" style="margin-top:6px"><button class="btn primary" onclick="V4Mail.reply(' + e.id +
           ')">📤 发送回复(SMTP)</button><span class="mini">发送前确认授权码已在「⚙️ 邮件设置」中配置。</span></div></div>';
      box.innerHTML = h;
    });
  }

  function sync() {
    var btn = document.querySelector('#mailPage .btn.primary');
    if (btn) { btn.disabled = true; btn.textContent = '同步中…'; }
    V4.api('/api/mail/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then(function (r) { toast('✅ 同步完成：新邮件 ' + (r.new || 0) + ' 封'); load(); })
      .catch(function () { if (btn) { btn.disabled = false; btn.textContent = '↻ 同步未读邮件'; } });
  }

  function convert(id) {
    V4.api('/api/mail/' + id + '/convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then(function (r) {
        toast(r.exists ? '✅ 已关联到已有客户 ' + r.company : '✅ 已创建新客户 ' + r.company);
        open(id); load();
      });
  }

  function showRelate(id) {
    V4.api('/api/customers').then(function (custs) {
      var box = V4.el('mailDetail');
      if (!box) return;
      var selBox = V4.el('relateBox');
      if (selBox) { selBox.remove(); return; }
      var opts = custs.map(function (c) {
        return '<option value="' + c.id + '">' + V4.esc(c.company) + (c.whatsapp_phone ? ' · ' + V4.esc(c.whatsapp_phone) : '') + '</option>';
      }).join('');
      var div = document.createElement('div');
      div.id = 'relateBox';
      div.innerHTML = '关联客户：<select id="relateCust">' + opts + '</select> ' +
        '<button class="btn primary" onclick="V4Mail.relate(' + id + ')">确定</button>';
      box.insertBefore(div, box.firstChild);
    });
  }

  function relate(id) {
    var v = V4.el('relateCust').value;
    V4.api('/api/mail/' + id + '/relate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: Number(v) })
    }).then(function () { toast('✅ 已关联'); open(id); load(); });
  }

  function reply(id) {
    var box = V4.el('replyBox');
    if (!box || !box.value.trim()) { toast('请先输入回复内容'); return; }
    V4.api('/api/mail/' + id + '/reply', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: box.value })
    }).then(function () { toast('✅ 回复已发送'); box.value = ''; });
  }

  /* ---------- 邮件配置弹窗(需求2) ---------- */
  function openConfig() {
    V4.api('/api/mail/config').then(function (r) {
      var cfg = r.config || {};
      var h = '<div class="mini" style="margin-bottom:10px">对接 Foxmail/QQ 邮箱：IMAP 拉取未读、SMTP 回复。' +
              'QQ 邮箱需在邮箱设置中开启 IMAP/SMTP 并生成“授权码”(非登录密码)。配置保存在本机数据库。</div>';
      h += '<div class="cfg-grid">';
      CFG_FIELDS.forEach(function (f) {
        var k = f[0], label = f[1], secret = f[2];
        var it = cfg[k] || {};
        var val = it.has_value ? (secret ? '******' : (it.value || '')) : (it.value || '');
        h += '<div><label>' + V4.esc(label) + (it.has_value ? ' <span class="pill ok">已保存</span>' : '') + '</label>' +
             '<input type="' + (secret ? 'password' : 'text') + '" id="mc_' + k + '" value="' + V4.esc(val) + '"' +
             (secret ? ' placeholder="留空表示不修改"' : '') + '></div>';
      });
      h += '</div><div class="mini" style="margin-top:8px">修改端口后建议 465(SMTP SSL) / 993(IMAP SSL)。授权码已保存时显示为掩码，不输入则保持不变。</div>';
      document.getElementById('mtitle').textContent = '邮件设置';
      document.getElementById('mbody').innerHTML = h;
      document.getElementById('modal').classList.add('open');
      document.getElementById('msave').onclick = saveConfig;
    });
  }

  function saveConfig() {
    var body = {};
    CFG_FIELDS.forEach(function (f) {
      var k = f[0];
      var inp = V4.el('mc_' + k);
      if (!inp) return;
      var v = inp.value;
      if (v === '******') return;          // 掩码保留原值
      body[k] = v;
    });
    V4.api('/api/mail/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) {
        toast('✅ 已保存 ' + (r.updated || []).length + ' 项邮件配置');
        document.getElementById('modal').classList.remove('open');
        load(); V4.tickMailBadge && V4.tickMailBadge();
      });
  }

  window.V4Mail = {
    load: load, sync: sync, open: open, convert: convert, relate: relate,
    showRelate: showRelate, reply: reply, openConfig: openConfig, saveConfig: saveConfig
  };
  V4.register('mail', load);
})();
