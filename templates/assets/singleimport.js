/* 单文件/多文件导入：扩展原“数据库导入”页 —— 支持直接选文件(不选文件夹)走同一套扫描+确认导入 */
(function () {
  var enhanced = false;

  function b64(buf) {
    var binary = '';
    var bytes = new Uint8Array(buf);
    var chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function init() {
    if (enhanced) return;
    enhanced = true;
    var sec = document.getElementById('imports');
    if (!sec) return;
    var div = document.createElement('div');
    div.className = 'card';
    div.style.marginBottom = '12px';
    div.innerHTML =
      '<div class="toolbar"><b>📄 单文件导入(升级版)</b><span class="sp"></span>' +
      '<input type="file" id="siFile" accept=".xlsx,.xls,.pdf" multiple style="font-size:13px">' +
      '<button class="btn primary" onclick="V4SI.scan()">扫描所选文件</button></div>' +
      '<div class="mini">支持 xlsx / xls / pdf；自动识别报价单与 PI 发票（合同文件自动跳过）。选择后点“扫描所选文件”→ 逐行确认 → 导入。' +
      '仍支持原有“整文件夹扫描”方式(见下方历史导入区)。</div>' +
      '<div id="siResult" style="margin-top:8px"></div>';
    sec.insertBefore(div, sec.firstChild);
  }

  function readFiles() {
    var inp = document.getElementById('siFile');
    var files = inp && inp.files ? Array.prototype.slice.call(inp.files) : [];
    return files;
  }

  function scan() {
    var files = readFiles();
    if (!files.length) { toast('请先选择文件（xlsx / xls / pdf）'); return; }
    var box = document.getElementById('siResult');
    box.innerHTML = '<div class="mini">正在读取并上传 ' + files.length + ' 个文件…</div>';
    var payloads = [];
    var idx = 0;
    function next() {
      if (idx >= files.length) return doScan(payloads);
      var f = files[idx++];
      var rd = new FileReader();
      rd.onload = function () {
        try {
          payloads.push({ file_name: f.name, relative_path: f.name, content_b64: b64(rd.result) });
        } catch (e) {
          box.innerHTML = '<div class="pill warn">文件过大或读取失败：' + f.name + '</div>';
        }
        next();
      };
      rd.onerror = function () { next(); };
      rd.readAsArrayBuffer(f);
    }
    next();
  }

  function doScan(payloads) {
    if (!payloads.length) { toast('没有可导入的文件'); return; }
    V4.api('/api/import-scan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ root_name: '单文件导入', files: payloads })
    }).then(function (r) {
      var rows = r.files || [];
      var h = '<table class="tbl"><thead><tr><th>文件名</th><th>识别类型</th><th>状态</th><th>说明</th><th>明细行</th></tr></thead><tbody>';
      rows.forEach(function (x) {
        var cls = x.status === '新文件' ? 'ok' : (x.status === '重复' || x.status === '跳过' ? 'gray' : 'warn');
        var dt = x.doc_type === 'pi' ? 'PI 发票' : (x.doc_type === 'quotation' ? '报价单' : (x.doc_type === 'contract' ? '合同' : '—'));
        h += '<tr><td>' + V4.esc(x.file_name) + '</td><td>' + V4.esc(dt) + '</td><td><span class="pill ' + cls + '">' +
             V4.esc(x.status) + '</span></td><td class="mini">' + V4.esc(x.message || '') + '</td><td>' +
             (x.row_count || 0) + '</td></tr>';
      });
      h += '</tbody></table>';
      var fresh = rows.filter(function (x) { return x.status === '新文件'; }).map(function (x) { return x.id; });
      h += '<div style="margin-top:8px">' +
           (fresh.length
             ? '<button class="btn primary" onclick="V4SI.confirm(' + JSON.stringify(fresh) + ')">✔ 确认导入 ' + fresh.length + ' 个文件</button>'
             : '<span class="mini">没有待导入的新文件</span>') +
           ' <button class="btn" onclick="V4SI.clear()">清除</button></div>';
      document.getElementById('siResult').innerHTML = h;
    });
  }

  function confirm(ids) {
    V4.api('/api/import-confirm', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ids })
    }).then(function (r) {
      toast('✅ 导入完成：' + (r.imported || 0) + ' 个' + (r.errors && r.errors.length ? '，失败 ' + r.errors.length : ''));
      document.getElementById('siResult').innerHTML = '';
      document.getElementById('siFile').value = '';
      if (typeof loadAll === 'function') loadAll();
    });
  }

  function clear() {
    document.getElementById('siResult').innerHTML = '';
    var inp = document.getElementById('siFile');
    if (inp) inp.value = '';
  }

  window.V4SI = { scan: scan, confirm: confirm, clear: clear };
  init();
})();
