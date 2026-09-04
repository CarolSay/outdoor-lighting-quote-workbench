/* 工作台2.0 公共层：样式注入 / 页面加载器注册 / 导航徽标 / 通用小工具 */
(function () {
  var css = [
    '.split{display:flex;gap:12px;align-items:flex-start}.split>div{min-width:0}',
    '.pane{flex:1}.pane-sm{flex:0 0 300px}',
    '.tbl{width:100%;border-collapse:collapse;background:#fff;font-size:13px}',
    '.tbl th,.tbl td{border-bottom:1px solid #eef1f5;padding:7px 9px;text-align:left;vertical-align:top}',
    '.tbl th{background:#f7f9fc;font-weight:600;position:sticky;top:0;cursor:pointer}',
    '.tbl tr:hover{background:#f4f8fd}',
    '.pill{display:inline-block;padding:1px 8px;border-radius:9px;font-size:11px;white-space:nowrap}',
    '.pill.new{background:#fff3e0;color:#e65100}.pill.ok{background:#e8f5e9;color:#1b5e20}',
    '.pill.warn{background:#fdecea;color:#c62828}.pill.gray{background:#eceff1;color:#455a64}',
    '.pill.blue{background:#e3f2fd;color:#0d47a1}',
    '.cfg-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}',
    '.cfg-grid label{display:block;font-size:12px;color:#555;margin-bottom:3px}',
    '.cfg-grid input{width:100%;padding:7px 9px;border:1px solid #d5dbe3;border-radius:6px;font-size:13px}',
    '.cfg-sec{border:1px solid #e5eaf1;border-radius:8px;padding:14px;margin-bottom:12px;background:#fff}',
    '.cfg-sec h4{margin:0 0 10px;font-size:14px}',
    '.mini{font-size:12px;color:#667}',
    '.detail-card{background:#fff;border:1px solid #e5eaf1;border-radius:8px;padding:12px;margin-top:10px}',
    '.rowbtn{margin-right:6px;margin-bottom:4px}',
    '.mail-row{cursor:pointer;border-bottom:1px solid #eef1f5;padding:8px 10px}',
    '.mail-row:hover{background:#f2f6fb}.mail-row b{font-size:13px}',
    '.mail-unread{background:#fff7f7}',
    '#mailBadge{display:none;margin-left:6px;background:#e5484d;color:#fff;border-radius:9px;padding:0 7px;font-size:11px;line-height:16px}',
    '.empty{padding:30px;text-align:center;color:#889;font-size:13px}',
    '.kv{display:flex;font-size:13px;margin:3px 0}.kv b{width:90px;color:#556;font-weight:600}',
    '.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}',
    '.toolbar .sp{flex:1}',
    '.btn:disabled{opacity:.5;cursor:not-allowed}'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var extraTitles = { mail: '邮件' };
  if (typeof titles !== 'undefined') Object.assign(titles, extraTitles);

  var loaders = {};
  window.V4 = {
    api: function (u, opt) { return api(u, opt).catch(function (e) { toast('⚠️ ' + e.message); throw e; }); },
    el: function (id) { return document.getElementById(id); },
    esc: function (s) { return esc(s); },
    register: function (page, fn) { loaders[page] = fn; },
    has: function (page) { return !!loaders[page]; },
    num: function (n) {
      if (n === null || n === undefined || n === '') return '';
      return Number(n).toLocaleString();
    },
    dt: function (s) {
      if (!s) return '';
      return String(s).slice(0, 16);
    },
    badge: function (text) {
      var b = V4.el('mailBadge');
      if (!b) return;
      if (text > 0) { b.style.display = 'inline'; b.textContent = text; } else { b.style.display = 'none'; b.textContent = ''; }
    },
    tickMailBadge: function () { tickMail(); }
  };

  // 覆盖 showPage：先执行原逻辑，再触发对应页加载器
  var origShow = window.showPage || function () {};
  window.showPage = function (p) {
    origShow(p);
    var f = loaders[p];
    if (f) { try { f(); } catch (e) { toast('⚠️ ' + e.message); } }
  };

  function tickMail() {
    V4.api('/api/mail/summary')
      .then(function (s) { if (s && s.unread !== undefined) V4.badge(s.unread); })
      .catch(function () {});
  }
  tickMail();
  setInterval(tickMail, 90000);
})();
