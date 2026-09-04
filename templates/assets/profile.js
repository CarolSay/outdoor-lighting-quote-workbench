/* 报价助手 - 客户画像页面 */
(function () {
  var profileState = {
    customers: [],
    currentCustomerId: null,
    profile: null,
    stats: null,
    excelList: [],
    attachments: [],
    prompts: []
  };

  var $ = function (id) { return document.getElementById(id); };

  V4.register('customer_profile', function () {
    loadProfilePage();
  });

  async function loadProfilePage() {
    try {
      profileState.customers = await V4.api('/api/customers');
      renderCustomerSelector();
      if (profileState.customers.length > 0) {
        await selectCustomer(profileState.customers[0].id);
      }
    } catch (e) {
      toast('⚠️ 加载客户列表失败：' + e.message);
    }
  }

  // ==================== 客户选择器 ====================
  function renderCustomerSelector() {
    var sel = $('pf_customer_sel');
    if (!sel) return;
    sel.innerHTML = profileState.customers
      .filter(function (c) { return c.active; })
      .map(function (c) {
        return '<option value="' + c.id + '">' + esc(c.company) + ' · ' + esc(c.country || '') + '</option>';
      }).join('');
  }

  window.selectCustomer = async function (cid) {
    cid = parseInt(cid);
    profileState.currentCustomerId = cid;
    try {
      var results = await Promise.all([
        V4.api('/api/customer-profiles/' + cid),
        V4.api('/api/customer-profiles/' + cid + '/stats'),
        V4.api('/api/customer-profiles/' + cid + '/excel-list'),
        V4.api('/api/customer-profiles/' + cid + '/attachments'),
        V4.api('/api/ai-prompts')
      ]);
      profileState.profile = results[0];
      profileState.stats = results[1];
      profileState.excelList = results[2];
      profileState.attachments = results[3];
      profileState.prompts = results[4].prompts || [];
      renderProfile();
    } catch (e) {
      toast('⚠️ 加载画像失败：' + e.message);
    }
  };

  window.refreshStats = async function () {
    if (!profileState.currentCustomerId) return;
    try {
      profileState.stats = await V4.api('/api/customer-profiles/' + profileState.currentCustomerId + '/stats');
      profileState.excelList = await V4.api('/api/customer-profiles/' + profileState.currentCustomerId + '/excel-list');
      renderProfile();
      toast('✅ 报价统计已刷新');
    } catch (e) {
      toast('⚠️ ' + e.message);
    }
  };

  // ==================== 渲染画像 ====================
  function renderProfile() {
    var p = profileState.profile || {};
    var s = profileState.stats || {};
    var cust = p.customer || {};

    // 基础档案
    $('pf_company').textContent = cust.company || '-';
    $('pf_country').textContent = (cust.country || '') + (cust.city ? ' / ' + cust.city : '') || '-';
    $('pf_website').value = p.website || '';
    $('pf_contact').value = cust.whatsapp_phone || cust.email || '';
    $('pf_scale').value = p.company_scale || '';
    $('pf_main_products').value = p.main_products || '';
    $('pf_type').textContent = cust.customer_type || '-';
    $('pf_notes').value = p.profile_notes || '';

    // 报价统计
    var discRange = '—';
    if (s.discount_min !== null && s.discount_max !== null) {
      discRange = s.discount_min.toFixed(1) + '% ~ ' + s.discount_max.toFixed(1) + '%';
    }
    $('pf_total_quotes').textContent = s.total_quotes || 0;
    $('pf_discount_range').textContent = discRange;
    $('pf_avg_mods').textContent = (s.avg_modifications || 0);
    $('pf_sample_count').textContent = s.sample_count || 0;
    $('pf_small_count').textContent = s.small_order_count || 0;
    $('pf_large_count').textContent = s.large_order_count || 0;

    // 汇率历史表格
    var rates = s.exchange_rate_history || [];
    $('pf_rate_table').innerHTML = rates.length === 0
      ? '<tr><td colspan="2" class="empty">暂无汇率数据</td></tr>'
      : rates.map(function (r) {
        return '<tr><td>' + esc(r.date) + '</td><td>' + (r.rate || '') + '</td></tr>';
      }).join('');

    // 沟通习惯
    $('pf_comm_time').value = p.comm_best_time || '';
    $('pf_comm_style').value = p.comm_style || '';
    $('pf_is_urgent').checked = p.is_urgent_order === 1;

    // 定制物流
    $('pf_forwarder').value = p.own_forwarder || '';
    $('pf_custom_level').value = p.custom_level || '';
    $('pf_certification').value = p.certification || '';
    $('pf_trade_terms').value = p.trade_terms_detail || '';

    // 风险备忘（高亮）
    $('pf_risk_notes').value = p.risk_notes || '';
    var riskBox = $('pf_risk_box');
    if (p.risk_notes && p.risk_notes.trim()) {
      riskBox.style.borderColor = '#e65100';
      riskBox.style.background = '#fff8f0';
    } else {
      riskBox.style.borderColor = '';
      riskBox.style.background = '';
    }

    // 报价摘要
    $('pf_quote_summary').value = p.quote_summary || '';

    // 更新时间
    $('pf_updated_at').textContent = p.updated_at
      ? V4.dt(p.updated_at)
      : '尚未保存';

    // 附件标记
    renderAttachmentBadges();

    // Excel 列表
    renderExcelList();

    // 附件列表
    renderAttachmentList();

    // 设置活动 tab
    switchTab('tab_stats');
  }

  // ==================== 附件徽章 ====================
  function renderAttachmentBadges() {
    var atts = profileState.attachments || [];
    var hasQuote = atts.some(function (a) { return a.attachment_type === 'quotation_file'; });
    var hasWA = atts.some(function (a) { return a.attachment_type === 'whatsapp_file'; });
    var websiteChecked = (profileState.profile || {}).website_checked === 1;

    $('badge_quotation').className = 'pill' + (hasQuote ? ' ok' : ' gray');
    $('badge_quotation').textContent = '报价单' + (hasQuote ? ' ✓' : '');
    $('badge_whatsapp').className = 'pill' + (hasWA ? ' ok' : ' gray');
    $('badge_whatsapp').textContent = 'WhatsApp文件' + (hasWA ? ' ✓' : '');
    $('badge_website').className = 'pill' + (websiteChecked ? ' ok' : ' gray');
    $('badge_website').textContent = '官网已查阅' + (websiteChecked ? ' ✓' : '');

    // 点击官网标记
    $('badge_website').onclick = function () {
      var p = profileState.profile || {};
      p.website_checked = p.website_checked ? 0 : 1;
      saveProfileSilent();
    };
  }

  // ==================== Excel 列表 ====================
  function renderExcelList() {
    var list = profileState.excelList || [];
    $('pf_excel_list').innerHTML = list.length === 0
      ? '<div class="empty">暂无导入的报价Excel文件</div>'
      : list.map(function (e) {
        return '<div class="verItem" style="display:flex;justify-content:space-between;align-items:center">'
          + '<span><b>' + esc(e.file_name) + '</b> <span class="hint">' + e.row_count + '行 · '
          + V4.dt(e.uploaded_at) + '</span></span>'
          + '<button class="btn small danger" onclick="deleteExcel(' + e.id + ')">删除</button>'
          + '</div>';
      }).join('');
  }

  window.deleteExcel = async function (eid) {
    if (!confirm('确认删除该导入文件及其所有报价明细？')) return;
    try {
      await V4.api('/api/customer-quote-excels/' + eid, { method: 'DELETE' });
      await refreshStats();
      toast('已删除');
    } catch (e) {
      toast('⚠️ ' + e.message);
    }
  };

  // ==================== 附件列表 ====================
  function renderAttachmentList() {
    var list = profileState.attachments || [];
    var typeLabels = { quotation_file: '报价单', whatsapp_file: 'WhatsApp', website_check: '官网' };
    $('pf_attach_list').innerHTML = list.length === 0
      ? '<div class="empty">暂无附件</div>'
      : list.map(function (a) {
        return '<div class="verItem" style="display:flex;justify-content:space-between;align-items:center">'
          + '<span><span class="pill blue">' + esc(typeLabels[a.attachment_type] || a.attachment_type) + '</span> '
          + '<b>' + esc(a.file_name) + '</b> <span class="hint">' + V4.dt(a.uploaded_at) + '</span></span>'
          + '<button class="btn small danger" onclick="deleteAttachment(' + a.id + ')">删除</button>'
          + '</div>';
      }).join('');
  }

  window.deleteAttachment = async function (aid) {
    if (!confirm('确认删除该附件？')) return;
    try {
      await V4.api('/api/customer-attachments/' + aid, { method: 'DELETE' });
      profileState.attachments = await V4.api('/api/customer-profiles/' + profileState.currentCustomerId + '/attachments');
      renderAttachmentBadges();
      renderAttachmentList();
      toast('已删除');
    } catch (e) {
      toast('⚠️ ' + e.message);
    }
  };

  // ==================== 保存画像 ====================
  window.saveProfile = async function () {
    if (!profileState.currentCustomerId) return;
    var data = {
      company_scale: $('pf_scale').value,
      main_products: $('pf_main_products').value,
      website: $('pf_website').value,
      comm_best_time: $('pf_comm_time').value,
      comm_style: $('pf_comm_style').value,
      is_urgent_order: $('pf_is_urgent').checked ? 1 : 0,
      own_forwarder: $('pf_forwarder').value,
      custom_level: $('pf_custom_level').value,
      certification: $('pf_certification').value,
      trade_terms_detail: $('pf_trade_terms').value,
      risk_notes: $('pf_risk_notes').value,
      profile_notes: $('pf_notes').value,
      quote_summary: $('pf_quote_summary').value,
      website_checked: (profileState.profile || {}).website_checked || 0
    };
    try {
      await V4.api('/api/customer-profiles/' + profileState.currentCustomerId, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      profileState.profile = await V4.api('/api/customer-profiles/' + profileState.currentCustomerId);
      renderProfile();
      toast('✅ 画像已保存');
    } catch (e) {
      toast('⚠️ 保存失败：' + e.message);
    }
  };

  async function saveProfileSilent() {
    if (!profileState.currentCustomerId) return;
    var p = profileState.profile || {};
    var data = {
      company_scale: $('pf_scale').value,
      main_products: $('pf_main_products').value,
      website: $('pf_website').value,
      comm_best_time: $('pf_comm_time').value,
      comm_style: $('pf_comm_style').value,
      is_urgent_order: $('pf_is_urgent').checked ? 1 : 0,
      own_forwarder: $('pf_forwarder').value,
      custom_level: $('pf_custom_level').value,
      certification: $('pf_certification').value,
      trade_terms_detail: $('pf_trade_terms').value,
      risk_notes: $('pf_risk_notes').value,
      profile_notes: $('pf_notes').value,
      quote_summary: $('pf_quote_summary').value,
      website_checked: p.website_checked || 0
    };
    try {
      await V4.api('/api/customer-profiles/' + profileState.currentCustomerId, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      profileState.profile = await V4.api('/api/customer-profiles/' + profileState.currentCustomerId);
      renderAttachmentBadges();
    } catch (e) { /* silent */ }
  }

  // ==================== Tab 切换 ====================
  window.switchTab = function (tab) {
    ['tab_stats', 'tab_comm', 'tab_logistics', 'tab_risk'].forEach(function (t) {
      var btn = document.querySelector('.tab-btn[data-tab="' + t + '"]');
      var panel = $(t);
      if (t === tab) {
        if (btn) btn.classList.add('active');
        if (panel) panel.classList.remove('hidden');
      } else {
        if (btn) btn.classList.remove('active');
        if (panel) panel.classList.add('hidden');
      }
    });
  };

  // ==================== 导入 Excel ====================
  window.importQuoteExcel = function () {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.xlsx,.xls';
    inp.onchange = async function () {
      var file = inp.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = async function () {
        var b64 = reader.result.split(',')[1];
        try {
          var r = await V4.api('/api/customer-profiles/' + profileState.currentCustomerId + '/import-excel', {
            method: 'POST',
            body: JSON.stringify({ file_b64: b64, file_name: file.name })
          });
          toast('✅ 导入成功，共 ' + r.row_count + ' 行报价数据');
          await refreshStats();
        } catch (e) {
          toast('⚠️ 导入失败：' + e.message);
        }
      };
      reader.readAsDataURL(file);
    };
    inp.click();
  };

  // ==================== 上传附件 ====================
  window.uploadAttachment = function (atype) {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.onchange = async function () {
      var file = inp.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = async function () {
        var b64 = reader.result.split(',')[1];
        try {
          await V4.api('/api/customer-profiles/' + profileState.currentCustomerId + '/attachments', {
            method: 'POST',
            body: JSON.stringify({ file_b64: b64, file_name: file.name, attachment_type: atype })
          });
          profileState.attachments = await V4.api('/api/customer-profiles/' + profileState.currentCustomerId + '/attachments');
          renderAttachmentBadges();
          renderAttachmentList();
          toast('✅ 附件已上传');
        } catch (e) {
          toast('⚠️ 上传失败：' + e.message);
        }
      };
      reader.readAsDataURL(file);
    };
    inp.click();
  };

  // ==================== AI 提示词 ====================
  window.openAIPrompt = function () {
    var cust = (profileState.profile || {}).customer || {};
    var s = profileState.stats || {};
    var p = profileState.profile || {};

    var discRange = '—';
    if (s.discount_min !== null && s.discount_max !== null) {
      discRange = s.discount_min.toFixed(1) + '% ~ ' + s.discount_max.toFixed(1) + '%';
    }

    var html = '<div class="form">'
      + '<div class="field"><label>选择AI分析任务</label>'
      + '<select id="ai_prompt_type" onchange="updateAIPrompt()">'
      + profileState.prompts.map(function (pt) {
        return '<option value="' + pt.key + '">' + esc(pt.label) + ' — ' + esc(pt.desc) + '</option>';
      }).join('')
      + '</select></div>'
      + '<div class="field full"><label>粘贴素材（聊天记录 / 文本 / 补充信息）</label>'
      + '<textarea id="ai_extra" style="min-height:120px" placeholder="在此粘贴 WhatsApp 聊天记录、官网文本、或其他需要 AI 分析的素材..."></textarea></div>'
      + '<div class="field full"><label>生成的提示词</label>'
      + '<textarea id="ai_result" style="min-height:180px;background:#f7f9fc" readonly></textarea></div>'
      + '</div>';

    $('mtitle').textContent = '复制AI提示词';
    $('mbody').innerHTML = html;
    $('modal').classList.add('open');
    $('msave').textContent = '复制到剪贴板';
    $('msave').onclick = function () {
      var text = $('ai_result').value;
      if (!text.trim()) return toast('请先生成提示词');
      navigator.clipboard.writeText(text).then(function () {
        toast('✅ 提示词已复制到剪贴板，请粘贴到外部AI工具');
        closeModal();
      }).catch(function () {
        $('ai_result').select();
        document.execCommand('copy');
        toast('✅ 提示词已复制');
      });
    };

    updateAIPrompt();
  };

  window.updateAIPrompt = function () {
    var key = $('ai_prompt_type').value;
    var extra = $('ai_extra').value;
    var cust = (profileState.profile || {}).customer || {};
    var s = profileState.stats || {};
    var p = profileState.profile || {};

    var discRange = '—';
    if (s.discount_min !== null && s.discount_max !== null) {
      discRange = s.discount_min.toFixed(1) + '% ~ ' + s.discount_max.toFixed(1) + '%';
    }

    var templates = {
      website: '请帮我分析以下客户的公司背景：\n客户名称：{company}\n官网：{website}\n国家：{country}\n\n请从以下维度分析：\n1. 公司规模与定位（分销商/工程商/终端用户）\n2. 主营产品线与我司产品的匹配度\n3. 采购能力与信用评估\n4. 潜在合作机会与风险点\n\n--- 以下粘贴官网内容或自行补充 ---\n{extra}',
      whatsapp: '请分析以下与客户 {company} 的WhatsApp聊天记录：\n\n--- 聊天记录 ---\n{extra}\n--- 结束 ---\n\n请提取以下信息：\n1. 客户沟通风格（直接/委婉/技术型/价格型）\n2. 最佳联系时间\n3. 是否急单型客户\n4. 关键需求与痛点\n5. 决策链与采购流程\n6. 价格敏感度',
      quote_analysis: '请分析以下客户 {company} 的报价数据：\n\n报价统计：\n- 近N年报价单数：{total_quotes}\n- 成交折扣区间：{discount_range}\n- 平均修改次数：{avg_modifications}\n- 样品单数：{sample_count}\n- 大单数：{large_count}，小单数：{small_count}\n\n--- 附加信息 ---\n{extra}\n\n请分析：\n1. 报价成交规律与定价建议\n2. 折扣谈判策略\n3. 样品转化率评估\n4. 大小单分布特征\n5. 风险提示',
      comprehensive: '请综合以下信息，为 {company} 生成一份完整的客户画像：\n\n【基本信息】\n国家：{country}\n公司规模：{company_scale}\n主营产品：{main_products}\n官网：{website}\n\n【报价统计】\n报价单数：{total_quotes}，成交折扣区间：{discount_range}\n平均修改次数：{avg_modifications}，样品单：{sample_count}\n大单：{large_count}，小单：{small_count}\n\n【沟通习惯】\n最佳联系时间：{comm_best_time}\n沟通风格：{comm_style}\n是否急单：{is_urgent}\n\n【定制物流】\n自有货代：{own_forwarder}\n定制等级：{custom_level}\n认证要求：{certification}\n贸易术语：{trade_terms}\n\n【风险备忘】\n{risk_notes}\n\n【附加素材】\n{extra}\n\n请生成：\n1. 客户综合画像总结（200字以内）\n2. 报价策略建议\n3. 需要关注的3个关键风险点\n4. 下次沟通建议'
    };

    var tpl = templates[key] || '';
    var result = tpl
      .replace(/\{company\}/g, cust.company || '')
      .replace(/\{website\}/g, p.website || '')
      .replace(/\{country\}/g, cust.country || '')
      .replace(/\{company_scale\}/g, p.company_scale || '')
      .replace(/\{main_products\}/g, p.main_products || '')
      .replace(/\{total_quotes\}/g, s.total_quotes || 0)
      .replace(/\{discount_range\}/g, discRange)
      .replace(/\{avg_modifications\}/g, s.avg_modifications || 0)
      .replace(/\{sample_count\}/g, s.sample_count || 0)
      .replace(/\{large_count\}/g, s.large_order_count || 0)
      .replace(/\{small_count\}/g, s.small_order_count || 0)
      .replace(/\{comm_best_time\}/g, p.comm_best_time || '')
      .replace(/\{comm_style\}/g, p.comm_style || '')
      .replace(/\{is_urgent\}/g, (p.is_urgent_order === 1) ? '是' : '否')
      .replace(/\{own_forwarder\}/g, p.own_forwarder || '')
      .replace(/\{custom_level\}/g, p.custom_level || '')
      .replace(/\{certification\}/g, p.certification || '')
      .replace(/\{trade_terms\}/g, p.trade_terms_detail || '')
      .replace(/\{risk_notes\}/g, p.risk_notes || '')
      .replace(/\{extra\}/g, extra || '（未提供附加素材）');

    $('ai_result').value = result;
  };

  // ==================== 同步报价历史统计 ====================
  window.syncFromQuotations = async function () {
    if (!profileState.currentCustomerId) return;
    try {
      var qs = await V4.api('/api/customer-profiles/' + profileState.currentCustomerId + '/quotation-stats');
      // 合并到已有的 stats 对象中
      profileState.quotationStats = qs;
      renderQuotationStats(qs);
      toast('✅ 已从报价历史同步，共 ' + qs.total_quotes + ' 条报价，总额 $' + qs.total_amount_usd.toFixed(2));
    } catch (e) {
      toast('⚠️ 同步失败：' + e.message);
    }
  };

  function renderQuotationStats(qs) {
    // 在报价统计 tab 中追加历史报价数据
    var html = '';
    if (qs.total_quotes > 0) {
      html += '<div style="margin-top:12px;padding-top:12px;border-top:1px dashed #e5e7eb">'
        + '<b>📋 报价历史（系统同步）</b>'
        + '<div class="grid4" style="margin-top:8px">'
        + '<div class="kpi"><small>报价次数</small><b>' + qs.total_quotes + '</b></div>'
        + '<div class="kpi"><small>累计金额USD</small><b>$' + qs.total_amount_usd.toFixed(2) + '</b></div>'
        + '<div class="kpi"><small>平均金额USD</small><b>$' + qs.avg_amount_usd.toFixed(2) + '</b></div>'
        + '<div class="kpi"><small>产品总数</small><b>' + qs.total_qty + '</b></div>'
        + '</div>';

      if (qs.recent_quotes && qs.recent_quotes.length > 0) {
        html += '<div style="margin-top:10px"><b>最近报价</b>'
          + '<div class="tablewrap" style="max-height:180px"><table style="min-width:400px">'
          + '<thead><tr><th>报价号</th><th>日期</th><th>金额USD</th><th>状态</th></tr></thead><tbody>';
        qs.recent_quotes.forEach(function (q) {
          html += '<tr><td>' + esc(q.quote_no) + '</td><td>' + esc(q.date) + '</td>'
            + '<td>$' + (q.total_usd || 0).toFixed(2) + '</td><td>' + esc(q.status) + '</td></tr>';
        });
        html += '</tbody></table></div></div>';
      }
      html += '</div>';
    }
    var existing = $('pf_quotation_stats');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.id = 'pf_quotation_stats';
    el.innerHTML = html;
    $('tab_stats').appendChild(el);
  }
  window.exportProfile = function (fmt) {
    if (!profileState.currentCustomerId) return;
    window.location = '/api/customer-profiles/' + profileState.currentCustomerId + '/export/' + fmt;
  };

  // ==================== 新增客户 ====================
  window.openNewCustomer = function () {
    openCustomer();
    var orig = $('msave').onclick;
    $('msave').onclick = async function () {
      await orig();
      await loadProfilePage();
      if (profileState.customers.length > 0) {
        var last = profileState.customers[profileState.customers.length - 1];
        $('pf_customer_sel').value = last.id;
        await selectCustomer(last.id);
      }
    };
  };

})();