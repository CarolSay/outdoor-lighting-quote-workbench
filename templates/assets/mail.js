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
    h += '<button class="btn primary" onclick="V4Mail.compose()">✉️ 写邮件</button>';
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

  function compose() {
    var h = '<div class="form" style="grid-template-columns:1fr">';
    h += '<div class="field full"><label>收件人（逗号分隔多人，支持手动输入+导入）</label>';
    h += '<input id="mc_to" placeholder="a@b.com, c@d.com" style="width:100%">';
    h += '<div style="margin-top:4px">';
    h += '<input type="file" id="mc_to_file" accept=".txt,.csv,.xlsx,.xls" style="display:none" onchange="V4Mail.importEmails(this)">';
    h += '<button class="btn small" onclick="document.getElementById(\'mc_to_file\').click()">📂 导入收件人文件</button>';
    h += '<span class="mini" id="mc_to_hint" style="margin-left:6px">支持 txt/csv/xlsx，自动提取邮箱地址</span>';
    h += '</div></div>';
    h += '<div class="field full"><label>抄送（可选）</label><input id="mc_cc" placeholder="可留空" style="width:100%"></div>';
    h += '<div class="field full"><label>主题</label><input id="mc_subject" value="From CM Quote Workbench" style="width:100%"></div>';
    h += '<div class="field full"><label>正文</label><textarea id="mc_content" rows="6" style="width:100%;min-height:120px;font-family:inherit"></textarea></div>';
    h += '</div><div class="mini" style="margin-top:8px">邮件将从配置的邮箱账号发出，SMTP SSL 加密传输。发送前请确认主题和正文内容。</div>';
    document.getElementById('mtitle').textContent = '写邮件';
    document.getElementById('mbody').innerHTML = h;
    document.getElementById('modal').classList.add('open');
    document.getElementById('msave').textContent = '📤 发送';
    document.getElementById('msave').onclick = function () {
      var body = {
        to: V4.el('mc_to').value,
        cc: V4.el('mc_cc').value,
        subject: V4.el('mc_subject').value,
        content: V4.el('mc_content').value
      };
      if (!body.to.trim()) { toast('请先填写或导入收件人'); return; }
      if (!body.content.trim()) { toast('请先输入邮件正文'); return; }
      document.getElementById('msave').disabled = true;
      V4.api('/api/mail/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) {
          toast('✅ 邮件已发送至 ' + (r.to || ''));
          document.getElementById('modal').classList.remove('open');
          document.getElementById('msave').disabled = false;
        })
        .catch(function (e) {
          toast('❌ 发送失败：' + e.message);
          document.getElementById('msave').disabled = false;
        });
    };
  }

  /* 导入收件人文件：读取 txt/csv，正则提取邮箱地址追加到收件人输入框 */
  function importEmails(input) {
    var file = input.files[0];
    if (!file) return;
    var hint = V4.el('mc_to_hint');
    hint.textContent = '正在读取 ' + file.name + ' ...';
    var reader = new FileReader();
    reader.onload = function (e) {
      var text = '';
      var raw = e.target.result;
      /* xlsx/xls 二进制：尝试简单提取文本（非Excel专用库，仅尽力提取可见文本） */
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        /* 二进制中提取可见 ASCII 文本片段 */
        var decoded = '';
        try {
          /* 尝试 TextDecoder 解码 UTF-8 字节序列 */
          var bytes = new Uint8Array(raw);
          for (var i = 0; i < bytes.length; i++) {
            var b = bytes[i];
            if ((b >= 32 && b < 127) || b === 10 || b === 13 || b >= 128) decoded += String.fromCharCode(b);
          }
        } catch (ex) {}
        text = decoded;
      } else {
        text = typeof raw === 'string' ? raw : '';
      }
      /* 正则提取邮箱地址 */
      var emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      var matches = text.match(emailRe) || [];
      /* 去重 */
      var seen = {};
      var emails = [];
      matches.forEach(function (m) {
        var lc = m.toLowerCase();
        if (!seen[lc]) { seen[lc] = 1; emails.push(m); }
      });
      var inp = V4.el('mc_to');
      var existing = inp.value.trim();
      /* 合并已有手动输入的邮箱 */
      if (existing) {
        existing.split(/[,;\n]/).forEach(function (e2) {
          var t = e2.trim();
          if (t && !seen[t.toLowerCase()]) { seen[t.toLowerCase()] = 1; emails.unshift(t); }
        });
      }
      inp.value = emails.join(', ');
      hint.textContent = '已从 ' + file.name + ' 提取 ' + emails.length + ' 个邮箱地址';
    };
    /* txt/csv 用文本读取，xlsx/xls 用 ArrayBuffer */
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file, 'utf-8');
    }
  }

  window.V4Mail = {
    load: load, sync: sync, open: open, convert: convert, relate: relate,
    showRelate: showRelate, reply: reply, openConfig: openConfig, saveConfig: saveConfig,
    compose: compose, importEmails: importEmails
  };
  V4.register('mail', load);
})();
