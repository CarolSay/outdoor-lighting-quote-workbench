/* 报价历史页：全字段筛选(需求4) */
(function () {
  function load() {
    var box = V4.el('historyPage');
    box.innerHTML =
      '<div class="toolbar"><b>报价历史</b><span class="sp"></span><button class="btn" onclick="V4History.load()">↻ 查询</button></div>' +
      '<div class="quote-search"><div class="filters" style="flex-wrap:wrap;gap:8px">' +
      '<input id="hf_no" placeholder="报价号" style="min-width:150px" onkeydown="if(event.key===\'Enter\')V4History.load()">' +
      '<input id="hf_customer" placeholder="客户名称" style="min-width:140px" onkeydown="if(event.key===\'Enter\')V4History.load()">' +
      '<input id="hf_project" placeholder="项目名称" style="min-width:140px" onkeydown="if(event.key===\'Enter\')V4History.load()">' +
      '<input id="hf_product" placeholder="产品名称/描述" style="min-width:180px" onkeydown="if(event.key===\'Enter\')V4History.load()">' +
      '<select id="hf_status" onchange="V4History.load()"><option value="">全部状态</option><option>报价草稿</option><option>正式版本</option></select>' +
      '<input id="hf_from" type="date" onchange="V4History.load()"><span class="mini">至</span>' +
      '<input id="hf_to" type="date" onchange="V4History.load()">' +
      '<button class="btn primary" onclick="V4History.load()">🔍 筛选</button>' +
      '<button class="btn" onclick="V4History.reset()">重置</button>' +
      '<span class="hint" id="hfCount"></span></div>' +
      '<div class="mini" style="margin-top:6px">全部条件为 AND 组合；产品条件同时匹配明细的商品名称与商品描述（多个关键词用空格分隔）。</div></div>' +
      '<div class="tablewrap"><table><thead><tr><th>报价号</th><th>日期</th><th>客户</th><th>项目</th><th>状态</th><th>来源</th><th>金额USD</th><th>记录时间</th><th>操作</th><th>Excel</th></tr></thead><tbody id="ht">加载中…</tbody></table></div>';
    V4History.load();
  }

  function params() {
    var p = new URLSearchParams();
    var map = { hf_no: 'quote_no', hf_customer: 'customer', hf_project: 'project', hf_product: 'product' };
    Object.keys(map).forEach(function (id) {
      var v = (V4.el(id).value || '').trim();
      if (v) p.append(map[id], v);
    });
    var st = V4.el('hf_status').value;
    if (st) p.append('status', st);
    if (V4.el('hf_from').value) p.append('date_from', V4.el('hf_from').value);
    if (V4.el('hf_to').value) p.append('date_to', V4.el('hf_to').value);
    return p.toString();
  }

  function loadRows() {
    V4.api('/api/quotation-history' + (params() ? '?' + params() : '')).then(function (rows) {
      var tb = V4.el('ht');
      if (!tb) return;
      var cnt = V4.el('hfCount');
      if (cnt) cnt.textContent = rows.length + ' 条记录';
      if (!rows.length) { tb.innerHTML = '<tr><td colspan="10"><div class="empty">没有符合条件的报价历史，请调整筛选条件</div></td></tr>'; return; }
      tb.innerHTML = rows.map(function (r) {
        var src = V4.esc(r.source_type || '手动创建');
        if (r.source_file) src += '<div class="mini" title="' + V4.esc(r.source_file) + '">📄 ' + V4.esc(r.source_file.length > 34 ? r.source_file.slice(0, 33) + '…' : r.source_file) + '</div>';
        return '<tr><td><b>' + V4.esc(r.quote_no) + '</b></td><td>' + V4.dt(r.quote_date) + '</td>' +
          '<td>' + V4.esc(r.company) + '</td><td>' + V4.esc(r.project_name || '') + '</td>' +
          '<td><span class="pill ' + (r.status === '正式版本' ? 'ok' : 'gray') + '">' + V4.esc(r.status) + '</span></td>' +
          '<td>' + src + '</td>' +
          '<td>' + V4.num(r.total_usd) + '</td><td class="mini">' + V4.dt(r.created_at) + '</td>' +
          '<td>' + (r.quotation_id ? '<button class="btn small" onclick="V4History.copy(' + r.quotation_id + ')">复制</button>' : '') + '</td>' +
          '<td>' + (r.quotation_id ? '<button class="btn small" onclick="V4History.excel(' + r.quotation_id + ')">下载</button>' : '—') + '</td></tr>';
      }).join('');
    });
  }

  function reset() {
    ['hf_no', 'hf_customer', 'hf_project', 'hf_product', 'hf_from', 'hf_to'].forEach(function (id) { V4.el(id).value = ''; });
    V4.el('hf_status').value = '';
    loadRows();
  }

  window.V4History = { load: loadRows, reset: reset, copy: function (id) { window.copyFormalQuote && window.copyFormalQuote(id); }, excel: function (id) { window.location = '/api/quotations/' + id + '/excel'; } };
  V4.register('history', load);
})();
