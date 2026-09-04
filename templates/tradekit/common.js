/* ===== TradeKit - Shared JavaScript Utilities ===== */

// ===== Constants =====
const CURRENCIES = ['USD','CNY','EUR','GBP','JPY','HKD','AUD','CAD','KRW','SGD','THB','INR','BRL','RUB','MXN'];
const CURRENCY_NAMES = {USD:'美元',CNY:'人民币',EUR:'欧元',GBP:'英镑',JPY:'日元',HKD:'港币',AUD:'澳元',CAD:'加元',KRW:'韩元',SGD:'新元',THB:'泰铢',INR:'卢比',BRL:'雷亚尔',RUB:'卢布',MXN:'比索'};

const DOCUMENT_TYPES = [
  'commercial_invoice','cost_estimation','commercial_quotation','invoice_number',
  'packing_list','proforma_invoice','trade_contract','shipping_mark',
  'currency_converter','certificate_of_origin','payment_calculator',
  'bill_of_lading','insurance_policy','customs_declaration','inspection_certificate',
  'fumigation_certificate','beneficiary_certificate','shipper_letter_instruction',
  'commercial_packing_list'
];

const UTILITY_TOOLS = new Set(['invoice_number','shipping_mark','currency_converter','payment_calculator']);

// ===== i18n =====
const I18N = {
  zh: {
    heroTitle: 'TradeKit 外贸单证工具箱',
    heroTitleEn: 'TradeKit — Trade Document Generator',
    heroDesc: '涵盖商业发票、装箱单、提单、合同等 19 种外贸单证，支持中英双语切换、A4 横版 PDF 一键导出。',
    heroDescEn: 'Generate 19 trade documents — invoices, packing lists, bills of lading, contracts and more. Bilingual support, one-click A4 PDF export.',
    badge: '免费开源 · 数据本地 · 无需注册',
    badgeEn: 'Free & Open Source · Local Data · No Signup',
    sectionDoc: '单证生成', sectionDocEn: 'Document Generators',
    sectionUtil: '实用工具', sectionUtilEn: 'Utility Tools',
    sectionCert: '物流与认证', sectionCertEn: 'Logistics & Certification',
    startCreate: '开始创建 →', startCreateEn: 'Get Started →',
    startUtil: '立即使用 →', startUtilEn: 'Use Now →',
    docCount: '7 款工具', docCountEn: '7 Tools',
    toolCount: '4 款工具', toolCountEn: '4 Tools',
    certCount: '8 款工具', certCountEn: '8 Tools',
    footerNote: '所有数据仅存储在浏览器本地，不会上传至任何服务器',
    footerNoteEn: 'All data is stored locally in your browser and never uploaded to any server.',
    featCustoms: '海关清关', featCustomsEn: 'Customs Clearance',
    featCustomsDesc: '单证规范，直接导出', featCustomsDescEn: 'Standard docs, direct export',
    featPdf: 'PDF 导出', featPdfEn: 'PDF Export',
    featPdfDesc: 'A4 横版，专业排版', featPdfDescEn: 'A4 landscape, professional',
    featBilingual: '中英双语', featBilingualEn: 'Bilingual',
    featBilingualDesc: '英文为主，中文辅助', featBilingualDescEn: 'English primary, Chinese assist',
    featLocal: '数据本地', featLocalEn: 'Local Data',
    featLocalDesc: '浏览器存储，不上传', featLocalDescEn: 'Browser storage, no upload',
    backHome: '返回主页', loadSample: '加载示例', clear: '清空',
    preview: '预览 →', backEdit: '← 返回编辑', exportPdf: '导出PDF', generating: '生成中...',
    print: '打印',
    formEditor: 'Form Editor / 表单编辑', previewTab: 'Preview / 预览', historyTab: 'History / 历史记录',
    searchPlaceholder: '按编号搜索...', records: '条记录', clearAll: '清除全部',
    noHistory: '暂无记录，导出 PDF 时会自动保存数据快照。',
    restore: '恢复', delete: '删除',
    clearTitle: '清空确认', clearMsg: '确定要清空所有内容吗？', cancel: '取消',
    addItem: '+ Add Item / 添加项目',
    uploadLogo: 'Upload / 上传', logoHint: 'Recommended 200x60px, PNG/JPG/SVG, auto-fit',
    logoLabel: 'Company Logo / 企业 Logo',
    toggleLang: '中文/English',
  },
  en: {
    heroTitle: 'TradeKit — Trade Document Generator',
    heroTitleEn: 'TradeKit — Trade Document Generator',
    heroDesc: 'Generate 19 trade documents — invoices, packing lists, bills of lading, contracts and more. Bilingual support, one-click A4 PDF export.',
    heroDescEn: 'Generate 19 trade documents — invoices, packing lists, bills of lading, contracts and more. Bilingual support, one-click A4 PDF export.',
    badge: 'Free & Open Source · Local Data · No Signup',
    badgeEn: 'Free & Open Source · Local Data · No Signup',
    sectionDoc: '单证生成', sectionDocEn: 'Document Generators',
    sectionUtil: '实用工具', sectionUtilEn: 'Utility Tools',
    sectionCert: '物流与认证', sectionCertEn: 'Logistics & Certification',
    startCreate: 'Get Started →', startCreateEn: 'Get Started →',
    startUtil: 'Use Now →', startUtilEn: 'Use Now →',
    docCount: '7 Tools', docCountEn: '7 Tools',
    toolCount: '4 Tools', toolCountEn: '4 Tools',
    certCount: '8 Tools', certCountEn: '8 Tools',
    footerNote: 'All data is stored locally in your browser and never uploaded to any server.',
    footerNoteEn: 'All data is stored locally in your browser and never uploaded to any server.',
    featCustoms: 'Customs Clearance', featCustomsEn: 'Customs Clearance',
    featCustomsDesc: 'Standard docs, direct export', featCustomsDescEn: 'Standard docs, direct export',
    featPdf: 'PDF Export', featPdfEn: 'PDF Export',
    featPdfDesc: 'A4 landscape, professional', featPdfDescEn: 'A4 landscape, professional',
    featBilingual: 'Bilingual', featBilingualEn: 'Bilingual',
    featBilingualDesc: 'English primary, Chinese assist', featBilingualDescEn: 'English primary, Chinese assist',
    featLocal: 'Local Data', featLocalEn: 'Local Data',
    featLocalDesc: 'Browser storage, no upload', featLocalDescEn: 'Browser storage, no upload',
    backHome: 'Home', loadSample: 'Load Sample', clear: 'Clear',
    preview: 'Preview →', backEdit: '← Back to Edit', exportPdf: 'Export PDF', generating: 'Generating...',
    print: 'Print',
    formEditor: 'Form Editor / 表单编辑', previewTab: 'Preview / 预览', historyTab: 'History / 历史记录',
    searchPlaceholder: 'Search by reference...', records: 'snapshots', clearAll: 'Clear All',
    noHistory: 'No history yet. Export PDF to save a snapshot.',
    restore: 'Restore', delete: 'Delete',
    clearTitle: 'Clear All Fields', clearMsg: 'Are you sure you want to clear all fields?', cancel: 'Cancel',
    addItem: '+ Add Item / 添加项目',
    uploadLogo: 'Upload / 上传', logoHint: 'Recommended 200x60px, PNG/JPG/SVG, auto-fit',
    logoLabel: 'Company Logo / 企业 Logo',
    toggleLang: 'EN/中文',
  }
};

// ===== Document Metadata =====
const DOC_META = {
  commercial_invoice: { title: 'Commercial Invoice Generator', titleZh: '商业发票', gradient: '#581c87, #7e22ce', badge: '#7c3aed', page: 'commercial-invoice.html' },
  cost_estimation: { title: 'Cost Estimation Generator', titleZh: '成本估算单', gradient: '#1e3a8a, #2563eb', badge: '#1d4ed8', page: 'cost-estimation.html' },
  commercial_quotation: { title: 'Commercial Quotation Generator', titleZh: '商业报价单', gradient: '#064e3b, #059669', badge: '#059669', page: 'commercial-quotation.html' },
  invoice_number: { title: 'Invoice Number Generator', titleZh: '发票编号生成器', gradient: '#7c2d12, #ea580c', badge: '#c2410c', page: 'invoice-number.html' },
  packing_list: { title: 'Packing List Generator', titleZh: '装箱单', gradient: '#134e4a, #0d9488', badge: '#0f766e', page: 'packing-list.html' },
  proforma_invoice: { title: 'Proforma Invoice Generator', titleZh: '形式发票', gradient: '#312e81, #4f46e5', badge: '#3730a3', page: 'proforma-invoice.html' },
  trade_contract: { title: 'Trade Contract Generator', titleZh: '外贸合同', gradient: '#0f172a, #334155', badge: '#334155', page: 'trade-contract.html' },
  shipping_mark: { title: 'Shipping Mark Generator', titleZh: '唛头生成器', gradient: '#164e63, #06b6d4', badge: '#0891b2', page: 'shipping-mark.html' },
  currency_converter: { title: 'Currency Converter', titleZh: '汇率换算', gradient: '#881337, #e11d48', badge: '#be123c', page: 'currency-converter.html' },
  certificate_of_origin: { title: 'Certificate of Origin', titleZh: '原产地证明', gradient: '#78350f, #d97706', badge: '#b45309', page: 'certificate-of-origin.html' },
  payment_calculator: { title: 'Payment Terms Calculator', titleZh: '付款条款计算器', gradient: '#0c4a6e, #0ea5e9', badge: '#0369a1', page: 'payment-calculator.html' },
  bill_of_lading: { title: 'Bill of Lading Generator', titleZh: '提单', gradient: '#022c22, #10b981', badge: '#047857', page: 'bill-of-lading.html' },
  insurance_policy: { title: 'Insurance Policy Generator', titleZh: '保险单', gradient: '#831843, #db2777', badge: '#be185d', page: 'insurance-policy.html' },
  customs_declaration: { title: 'Customs Declaration Generator', titleZh: '报关单', gradient: '#581c87, #a855f7', badge: '#9333ea', page: 'customs-declaration.html' },
  inspection_certificate: { title: 'Inspection Certificate Generator', titleZh: '检验证书', gradient: '#713f12, #eab308', badge: '#ca8a04', page: 'inspection-certificate.html' },
  fumigation_certificate: { title: 'Fumigation Certificate Generator', titleZh: '熏蒸证书', gradient: '#14532d, #22c55e', badge: '#15803d', page: 'fumigation-certificate.html' },
  beneficiary_certificate: { title: 'Beneficiary Certificate Generator', titleZh: '受益人证明', gradient: '#431407, #c2410c', badge: '#7c2d12', page: 'beneficiary-certificate.html' },
  shipper_letter_instruction: { title: "Shipper's Letter of Instruction", titleZh: '发货人委托书', gradient: '#1e3a8a, #3b82f6', badge: '#1e40af', page: 'shipper-letter-instruction.html' },
  commercial_packing_list: { title: 'Commercial Packing List Generator', titleZh: '详细装箱单', gradient: '#312e81, #6366f1', badge: '#4338ca', page: 'commercial-packing-list.html' },
};

const PDF_PREFIX = {
  commercial_invoice:'Commercial_Invoice', cost_estimation:'Cost_Estimation', commercial_quotation:'Commercial_Quotation',
  invoice_number:'Invoice_Number', packing_list:'Packing_List', proforma_invoice:'Proforma_Invoice',
  trade_contract:'Trade_Contract', shipping_mark:'Shipping_Mark', currency_converter:'Currency_Converter',
  certificate_of_origin:'Certificate_of_Origin', payment_calculator:'Payment_Terms', bill_of_lading:'Bill_of_Lading',
  insurance_policy:'Insurance_Policy', customs_declaration:'Customs_Declaration', inspection_certificate:'Inspection_Certificate',
  fumigation_certificate:'Fumigation_Certificate', beneficiary_certificate:'Beneficiary_Certificate',
  shipper_letter_instruction:'Shippers_Letter_Instruction', commercial_packing_list:'Commercial_Packing_List',
};

// ===== Home Page Doc Card Data =====
const DOC_CARDS = [
  // Document Generators
  { type:'commercial_invoice', title:'Commercial Invoice', subtitle:'商业发票', desc:'符合国际贸易规范的商业发票，涵盖买卖双方、商品明细与金额汇总。', descEn:'Commercial invoices complying with international trade standards with auto-summary.', features:['海关清关','自动汇总','正式发票'], featuresEn:['Customs Clearance','Auto Summary','Formal Invoice'] },
  { type:'packing_list', title:'Packing List', subtitle:'装箱单', desc:'详细列出货品包装信息的装箱单，与商业发票配套使用。', descEn:'Detailed packing list used alongside commercial invoices.', features:['包装明细','重量汇总','体积计算'], featuresEn:['Packing Details','Weight Summary','Volume Calc'] },
  { type:'proforma_invoice', title:'Proforma Invoice', subtitle:'形式发票', desc:'装船前发给买方的形式发票，用于申请进口许可证、开立信用证。', descEn:'Proforma invoice for import license application and L/C opening.', features:['信用证开立','进口许可','预开发票'], featuresEn:['L/C Opening','Import License','Pre-invoice'] },
  { type:'commercial_quotation', title:'Commercial Quotation', subtitle:'商业报价单', desc:'专业外贸报价单，涵盖买卖双方信息、付款与交货条款。', descEn:'Professional foreign trade quotation with flexible terms.', features:['条款灵活','折扣计算','签名确认'], featuresEn:['Flexible Terms','Discount Calc','Signature'] },
  { type:'trade_contract', title:'Trade Contract', subtitle:'外贸合同', desc:'买卖双方正式外贸合同，涵盖商业条款、法律条款与双方签署。', descEn:'Formal trade contract with commercial and legal clauses.', features:['条款完整','双方签署','法律条款'], featuresEn:['Complete Terms','Dual Signature','Legal Clauses'] },
  { type:'cost_estimation', title:'Cost Estimation', subtitle:'成本估算单', desc:'面向出口报价的详细成本分解工具，自动叠加利润、税金。', descEn:'Detailed cost breakdown for export pricing.', features:['分项核算','利润叠加','多币种'], featuresEn:['Itemized Calc','Profit Markup','Multi-currency'] },
  { type:'certificate_of_origin', title:'Certificate of Origin', subtitle:'原产地证明', desc:'原产地证明参考模板，包含出口商、收货人、运输路线。', descEn:'Certificate of origin reference template.', features:['参考模板','关税优惠','贸易合规'], featuresEn:['Reference Template','Tariff Benefit','Trade Compliance'] },
  // Utility Tools
  { type:'currency_converter', title:'Currency Converter', subtitle:'汇率换算', desc:'实时汇率换算工具，支持手动输入汇率。', descEn:'Currency converter with manual rate input.', features:['手动汇率','批量换算','历史记录'], featuresEn:['Manual Rate','Batch Convert','History'] },
  { type:'payment_calculator', title:'Payment Terms Calculator', subtitle:'付款条款计算器', desc:'快速计算外贸合同各阶段付款金额。', descEn:'Calculate payment amounts for trade contracts.', features:['付款模板','金额分解','灵活配置'], featuresEn:['Payment Presets','Amount Breakdown','Custom Config'] },
  { type:'invoice_number', title:'Invoice Number Generator', subtitle:'发票编号生成器', desc:'按规则自动生成和管理发票编号。', descEn:'Auto-generate and manage invoice numbers.', features:['规则配置','批量生成','编号管理'], featuresEn:['Rule Config','Batch Generate','Number Mgmt'] },
  { type:'shipping_mark', title:'Shipping Mark Generator', subtitle:'唛头生成器', desc:'快速生成标准化外箱唛头，三种样式可选。', descEn:'Generate standardized shipping marks with 3 styles.', features:['三种样式','一键复制','实时更新'], featuresEn:['3 Styles','One-click Copy','Live Update'] },
  // Logistics & Certification
  { type:'bill_of_lading', title:'Bill of Lading', subtitle:'提单', desc:'提单参考模板，包含发货人、收货人、通知方等信息。', descEn:'Bill of lading reference template.', features:['参考模板','船名航次','三方信息'], featuresEn:['Reference Template','Vessel/Voyage','Tri-party Info'] },
  { type:'insurance_policy', title:'Insurance Policy', subtitle:'保险单', desc:'保险单参考模板，涵盖投保人与受益人信息。', descEn:'Insurance policy reference template.', features:['参考模板','自动算费','险别选择'], featuresEn:['Reference Template','Auto Premium','Coverage Type'] },
  { type:'customs_declaration', title:'Customs Declaration', subtitle:'报关单', desc:'报关单参考模板，包含申报人信息与商品明细。', descEn:'Customs declaration reference template.', features:['参考模板','HS编码','贸易方式'], featuresEn:['Reference Template','HS Code','Trade Mode'] },
  { type:'inspection_certificate', title:'Inspection Certificate', subtitle:'检验证书', desc:'检验证书参考模板，包含检验标准与结果。', descEn:'Inspection certificate reference template.', features:['参考模板','批次管理','ISO标准'], featuresEn:['Reference Template','Batch Mgmt','ISO Standard'] },
  { type:'fumigation_certificate', title:'Fumigation Certificate', subtitle:'熏蒸证书', desc:'熏蒸证书参考模板，包含熏蒸剂类型、方法等信息。', descEn:'Fumigation certificate reference template.', features:['参考模板','熏蒸记录','检疫证明'], featuresEn:['Reference Template','Fumigation Log','Quarantine Cert'] },
  { type:'beneficiary_certificate', title:'Beneficiary Certificate', subtitle:'受益人证明', desc:'受益人证明参考模板，包含信用证号码、开证行。', descEn:'Beneficiary certificate reference template.', features:['参考模板','信用证','开证行'], featuresEn:['Reference Template','L/C','Issuing Bank'] },
  { type:'shipper_letter_instruction', title:"Shipper's Letter of Instruction", subtitle:'发货人委托书', desc:'向货代提供详细发货指示的委托书。', descEn:"Letter of instruction for freight forwarders.", features:['货代委托','运输指示','特殊要求'], featuresEn:['Forwarder SLI','Shipping Directive','Special Req'] },
  { type:'commercial_packing_list', title:'Commercial Packing List', subtitle:'详细装箱单', desc:'详细的商业装箱单，涵盖每项商品的包装信息。', descEn:'Detailed commercial packing list with itemized packaging.', features:['详细装箱','CBM计算','集装箱信息'], featuresEn:['Detailed Packing','CBM Calc','Container Info'] },
];

// ===== SVG Icons =====
const ICONS = {
  FileText: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>',
  Package: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  ClipboardList: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>',
  DollarSign: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  FileSignature: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M9 15l1.343-1.343a3 3 0 0 1 4.131 0l.171.172a2 2 0 0 1 0 2.828L13 18"/></svg>',
  Calculator: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="8" x2="8" y1="10" y2="10"/><line x1="12" x2="12" y1="10" y2="10"/><line x1="16" x2="16" y1="10" y2="10"/><line x1="8" x2="8" y1="14" y2="14"/><line x1="12" x2="12" y1="14" y2="14"/><line x1="16" x2="16" y1="14" y2="14"/><line x1="8" x2="8" y1="18" y2="18"/><line x1="12" x2="12" y1="18" y2="18"/><line x1="16" x2="16" y1="18" y2="18"/></svg>',
  Globe: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  ArrowLeftRight: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 4-4 4"/><path d="M4 7h8"/><path d="m16 21 4-4-4-4"/><path d="M20 17h-8"/></svg>',
  CreditCard: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',
  Hash: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>',
  Tag: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
  Anchor: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" x2="12" y1="22" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>',
  Shield: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6l8-4 8 4Z"/></svg>',
  FileSearch: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><circle cx="15" cy="15" r="3"/><path d="m20 20-1.5-1.5"/></svg>',
  ScrollText: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 9V5a2 2 0 0 0-2-2H8"/><line x1="10" x2="14" y1="9" y2="9"/><line x1="10" x2="14" y1="13" y2="13"/></svg>',
  Bug: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>',
  Award: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M8.271 14.055 5 21l3.271-2.105L12 21l2.729-2.105L18 21l-3.271-6.945"/><path d="M15.5 5.5a5.5 5.5 0 0 1-7 0"/></svg>',
  Plane: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>',
  PackageCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/><path d="m16.5 14.5 2 2 3.5-3.5"/></svg>',
  ShieldCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6l8-4 8 4Z"/><path d="m9 12 2 2 4-4"/></svg>',
  FileOutput: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>',
  Globe2: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12z"/><path d="M2 12a10 10 0 0 1 10-10v22A10 10 0 0 1 2 12z"/></svg>',
  Database: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5"/><path d="M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3"/></svg>',
  FileStack: '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>',
  Languages: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 3 3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>',
  Sun: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  Moon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  Upload: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
  X: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  ArrowLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
  Clock: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
};

function svg(name, size, color) {
  let s = ICONS[name];
  if (!s) return '';
  if (size) {
    s = s.replace(/width="[^"]*"/, 'width="'+size+'"').replace(/height="[^"]*"/, 'height="'+size+'"');
  }
  if (color) s = s.replace('currentColor', color);
  return s;
}

// ===== Doc card gradient and badge colors =====
const DOC_GRADIENTS = {
  commercial_invoice:'#581c87, #7e22ce', packing_list:'#134e4a, #0d9488', proforma_invoice:'#312e81, #4f46e5',
  commercial_quotation:'#064e3b, #059669', trade_contract:'#0f172a, #334155', cost_estimation:'#1e3a8a, #2563eb',
  certificate_of_origin:'#78350f, #d97706', currency_converter:'#881337, #e11d48', payment_calculator:'#0c4a6e, #0ea5e9',
  invoice_number:'#7c2d12, #ea580c', shipping_mark:'#164e63, #06b6d4', bill_of_lading:'#022c22, #10b981',
  insurance_policy:'#831843, #db2777', customs_declaration:'#581c87, #a855f7', inspection_certificate:'#713f12, #eab308',
  fumigation_certificate:'#14532d, #22c55e', beneficiary_certificate:'#431407, #c2410c',
  shipper_letter_instruction:'#1e3a8a, #3b82f6', commercial_packing_list:'#312e81, #6366f1',
};
const DOC_BADGES = {
  commercial_invoice:'#7c3aed', packing_list:'#0f766e', proforma_invoice:'#3730a3',
  commercial_quotation:'#059669', trade_contract:'#334155', cost_estimation:'#1d4ed8',
  certificate_of_origin:'#b45309', currency_converter:'#be123c', payment_calculator:'#0369a1',
  invoice_number:'#c2410c', shipping_mark:'#0891b2', bill_of_lading:'#047857',
  insurance_policy:'#be185d', customs_declaration:'#9333ea', inspection_certificate:'#ca8a04',
  fumigation_certificate:'#15803d', beneficiary_certificate:'#7c2d12',
  shipper_letter_instruction:'#1e40af', commercial_packing_list:'#4338ca',
};
const DOC_ICONS = {
  commercial_invoice:'FileText', packing_list:'Package', proforma_invoice:'ClipboardList',
  commercial_quotation:'DollarSign', trade_contract:'FileSignature', cost_estimation:'Calculator',
  certificate_of_origin:'Globe', currency_converter:'ArrowLeftRight', payment_calculator:'CreditCard',
  invoice_number:'Hash', shipping_mark:'Tag', bill_of_lading:'Anchor',
  insurance_policy:'Shield', customs_declaration:'FileSearch', inspection_certificate:'ScrollText',
  fumigation_certificate:'Bug', beneficiary_certificate:'Award',
  shipper_letter_instruction:'Plane', commercial_packing_list:'PackageCheck',
};

// ===== User & Key Management =====
function getUserId() {
  let id = localStorage.getItem('invoice_gen_user_id');
  if (!id) {
    id = 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('invoice_gen_user_id', id);
  }
  return id;
}
function userKey(key) { return getUserId() + '_' + key; }

// ===== Snapshot Management =====
function loadSnapshots(dt) {
  try {
    const raw = localStorage.getItem(userKey('doc_snapshots_' + dt));
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}
function saveSnapshots(dt, snaps) {
  try { localStorage.setItem(userKey('doc_snapshots_' + dt), JSON.stringify(snaps.slice(0, 50))); } catch(e) {}
}
function addSnapshot(dt, ref, data) {
  const snap = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,7),
    docType: dt, label: ref || 'draft', ref: ref || '',
    exportedAt: new Date().toISOString(),
    data: JSON.parse(JSON.stringify(data))
  };
  const existing = loadSnapshots(dt);
  existing.unshift(snap);
  saveSnapshots(dt, existing);
  return snap;
}
function deleteSnapshot(dt, id) {
  const existing = loadSnapshots(dt);
  saveSnapshots(dt, existing.filter(s => s.id !== id));
}
function clearAllSnapshots(dt) {
  saveSnapshots(dt, []);
}

// ===== Language & Theme =====
function getLang() {
  var saved = localStorage.getItem('app_lang');
  if (saved) return saved;
  // Check if we already did geo detection
  var geo = localStorage.getItem('app_geo_lang');
  if (geo) return geo;
  // Fallback: browser language
  var navLang = (navigator.language || navigator.userLanguage || 'zh-CN').toLowerCase();
  if (navLang.startsWith('en')) return 'en';
  return 'zh';
}

// Async IP-based language detection (called once per session)
function detectLangByIP() {
  if (localStorage.getItem('app_lang') || localStorage.getItem('app_geo_lang')) return;
  fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.country_code) {
        var geoLang = ['US','GB','CA','AU','NZ','IE'].includes(data.country_code) ? 'en' : 'zh';
        localStorage.setItem('app_geo_lang', geoLang);
        // Re-render if different from initial
        if (typeof render === 'function') render();
        if (typeof renderAll === 'function') renderAll();
      }
    })
    .catch(function() {});
}
function isDark() { return localStorage.getItem('app_theme') === 'dark'; }
function setLang(lang) { localStorage.setItem('app_lang', lang); }
function setTheme(dark) { localStorage.setItem('app_theme', dark ? 'dark' : 'light'); }

function applyTheme() {
  const dark = isDark();
  document.documentElement.classList.toggle('dark', dark);
  return dark;
}

function injectSpaButton() {
  if (document.getElementById('spa-top-btn')) return;
  var topBarRight = document.querySelector('.top-bar-right');
  if (!topBarRight) return;
  var lang = getLang();
  var isZh = lang === 'zh';
  var text = isZh ? '访问优化版 →' : 'Visit Optimized →';
  var btn = document.createElement('a');
  btn.id = 'spa-top-btn';
  btn.href = 'https://trade.treedeep.cn';
  btn.textContent = text;
  btn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;background:linear-gradient(to right,#7c3aed,#a855f7,#ec4899);color:#fff;font-size:12px;font-weight:600;text-decoration:none;cursor:pointer;transition:transform 0.15s ease,box-shadow 0.15s ease;';
  btn.onmouseenter = function() { btn.style.transform = 'scale(1.04)'; btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; };
  btn.onmouseleave = function() { btn.style.transform = ''; btn.style.boxShadow = ''; };
  topBarRight.insertBefore(btn, topBarRight.firstChild);
}

function injectBottomCta() {
  if (document.getElementById('bottom-cta-bar')) return;
  var main = document.querySelector('main');
  if (!main) return;
  var lang = getLang();
  var isZh = lang === 'zh';
  var bar = document.createElement('div');
  bar.id = 'bottom-cta-bar';
  bar.className = 'bottom-cta';
  bar.innerHTML = '<span style="font-size:13px;color:var(--text-secondary);">' + (isZh ? '想使用更好的交互体验？' : 'Looking for a better experience?') + '</span><a class="cta-btn" href="https://trade.treedeep.cn">' + (isZh ? '访问优化版 →' : 'Visit Optimized →') + '</a>';
  main.parentNode.insertBefore(bar, main.nextSibling);
}

// ===== FAQ Data =====
const FAQ_GENERAL = {
  zh: [
    { q: 'TradeKit是什么？需要付费吗？', a: 'TradeKit是免费开源的外贸单证生成工具，支持19种外贸单证类型。完全免费，无需注册或登录，打开网页即可使用。' },
    { q: '数据会上传到服务器吗？', a: '所有数据仅存储在浏览器 localStorage 中，不会上传至任何服务器。数据完全本地化，不会被第三方访问。' },
    { q: '导出的PDF是什么格式？', a: '导出的PDF为A4横版格式，采用专业的商业单证排版，适合打印和电子传输。' }
  ],
  en: [
    { q: 'What is TradeKit? Is it free?', a: 'TradeKit is a free, open-source trade document generator supporting 19 document types. No signup or login required — just open the page and start using it.' },
    { q: 'Is my data uploaded to a server?', a: 'All data is stored in your browser\'s localStorage and never uploaded to any server. Your data stays completely local and cannot be accessed by third parties.' },
    { q: 'What format is the exported PDF?', a: 'The exported PDF uses A4 landscape format with professional trade document layout, suitable for both printing and electronic transmission.' }
  ]
};

const FAQ_DOC_SPECIFIC = {
  commercial_invoice: {
    zh: [
      { q: '商业发票(Commercial Invoice)的作用是什么？', a: '商业发票是国际贸易中最核心的单证之一，用于海关清关、银行结汇和税务申报。它详细列明了买卖双方的信息、商品描述、数量、单价、总价、HS编码等关键数据。' },
      { q: '商业发票和形式发票有什么区别？', a: '商业发票是实际发货后出具的正式收款凭证，用于海关清关和财务入账；形式发票(Proforma Invoice)是发货前出具的预估发票，主要用于买方申请进口许可证或开立信用证，不具备收款效力。' }
    ],
    en: [
      { q: 'What is a Commercial Invoice used for?', a: 'A Commercial Invoice is one of the most critical documents in international trade, used for customs clearance (declaring goods value for duty), bank settlement, and buyer accounting. It details buyer/seller info, product descriptions, HS codes, quantities, and prices.' },
      { q: 'What is the difference between Commercial Invoice and Proforma Invoice?', a: 'A Commercial Invoice is the formal billing document issued after shipment for customs clearance and accounting. A Proforma Invoice is a pre-shipment estimated invoice used by the buyer to obtain import licenses or open letters of credit — it is not a demand for payment.' }
    ]
  },
  packing_list: {
    zh: [
      { q: '装箱单(Packing List)包含哪些信息？', a: '装箱单详细列明了每批货物的包装信息，包括包装件数、每件的毛重/净重、体积(CBM)、唛头、商品明细等。是海关查验和物流操作的重要依据。' },
      { q: '装箱单和商业发票有什么关系？', a: '装箱单和商业发票通常配套使用：发票侧重商品价值和交易条款，装箱单侧重实物包装和物流信息。两者一起用于海关清关和货物运输。' }
    ],
    en: [
      { q: 'What information does a Packing List contain?', a: 'A Packing List details the physical aspects of the shipment: number of packages, gross/net weights per package, dimensions (CBM), shipping marks, and itemized contents. It is essential for customs inspection and logistics operations.' },
      { q: 'How does a Packing List relate to a Commercial Invoice?', a: 'They are used together: the Commercial Invoice focuses on goods value and transaction terms, while the Packing List focuses on physical packaging and logistics. Both are required for customs clearance and cargo transportation.' }
    ]
  },
  proforma_invoice: {
    zh: [
      { q: '形式发票(Proforma Invoice)什么时候使用？', a: '形式发票在正式发货前使用，主要用于买方申请进口许可证、办理外汇审批、开立信用证等。它是预估的发票，不作为正式的收款凭证。' },
      { q: '形式发票能用来收款吗？', a: '形式发票不是正式的收款凭证。它仅用于预估交易金额和提前办理相关手续，实际收款和报关需使用正式的商业发票。' }
    ],
    en: [
      { q: 'When should a Proforma Invoice be used?', a: 'A Proforma Invoice is used before actual shipment, primarily for the buyer to apply for import licenses, arrange foreign exchange approvals, or open letters of credit. It is an estimated invoice, not a formal payment demand.' },
      { q: 'Can a Proforma Invoice be used for payment collection?', a: 'No, a Proforma Invoice is not a formal payment document. It only provides estimated transaction amounts for advance procedures. Actual payment collection and customs clearance require a formal Commercial Invoice.' }
    ]
  },
  commercial_quotation: {
    zh: [
      { q: '报价单(Commercial Quotation)包含哪些关键条款？', a: '报价单包含商品描述、规格参数、数量、单价、总价、贸易术语(FOB/CIF等)、付款条件、有效期、交货期等。是买卖双方议价和签订合同的基础文件。' },
      { q: '报价单的有效期怎么设置？', a: '报价单应设置明确的有效期（如30天），超过有效期后报价自动失效。这有助于保护卖方免受市场价格波动和汇率变化的影响。' }
    ],
    en: [
      { q: 'What key terms should a Commercial Quotation include?', a: 'A Commercial Quotation should include product descriptions, specifications, quantities, unit prices, total amounts, trade terms (FOB/CIF/etc.), payment terms, validity period, and delivery dates. It forms the basis for price negotiation and contract signing.' },
      { q: 'How to set the validity period of a quotation?', a: 'A quotation should have a clear validity period (e.g., 30 days). After expiry, the quote automatically becomes invalid, protecting the seller from market price fluctuations and exchange rate changes.' }
    ]
  },
  trade_contract: {
    zh: [
      { q: '外贸合同必须包含哪些条款？', a: '外贸合同应包含买卖双方信息、商品描述、数量和规格、单价和总价、贸易术语、付款方式、交货期限、包装要求、质量标准、检验条款、不可抗力、争议解决等。' },
      { q: '合同中的不可抗力条款是什么？', a: '不可抗力是指无法预见、无法避免且无法克服的客观情况（如自然灾害、战争、政府行为等）。该条款规定在不可抗力事件发生时，受影响方可部分或全部免除合同责任。' }
    ],
    en: [
      { q: 'What clauses must a Trade Contract include?', a: 'A Trade Contract should include buyer/seller information, product descriptions, quantity and specifications, unit and total prices, trade terms, payment methods, delivery schedule, packaging requirements, quality standards, inspection clauses, force majeure, and dispute resolution.' },
      { q: 'What is the Force Majeure clause?', a: 'Force Majeure refers to unforeseeable, unavoidable, and insurmountable objective circumstances (natural disasters, war, government actions, etc.). This clause states that the affected party may be partially or fully exempted from contract obligations when such events occur.' }
    ]
  },
  cost_estimation: {
    zh: [
      { q: '成本估算单如何计算利润和税金？', a: '成本估算单根据各项成本（产品成本、运费、保险、关税等）为基础，按设定的利润率（如10%）和税率（如13%增值税）计算。还支持折扣和手续费的调整。' },
      { q: '成本估算和正式发票有什么关系？', a: '成本估算是交易前的预估工具，用于报价参考和成本分析。正式发票是交易后的收款凭证。两者数据可以相互对照，但估算值不等于最终交易金额。' }
    ],
    en: [
      { q: 'How does a Cost Estimation calculate profit and tax?', a: 'Cost Estimation calculates based on itemized costs (product, shipping, insurance, duties, etc.) with configurable profit margin (e.g., 10%) and tax rate (e.g., 13% VAT). It also supports discount and surcharge adjustments.' },
      { q: 'What is the relationship between Cost Estimation and formal invoice?', a: 'Cost Estimation is a pre-transaction planning tool for quotation reference. A formal invoice is the post-transaction payment document. The two can be cross-referenced, but estimated values do not equal final transaction amounts.' }
    ]
  },
  certificate_of_origin: {
    zh: [
      { q: '原产地证明(Certificate of Origin)的作用是什么？', a: '原产地证明用于证明货物的生产或制造地，是海关征收关税、实施贸易政策和执行原产地优惠政策的重要依据。部分国家凭此享受关税减免。' },
      { q: '原产地证明由哪个机构签发？', a: '原产地证明通常由出口国的商会（如中国国际贸易促进委员会CCPIT）或海关签发。中国出口企业可向当地贸促会或海关申请。' }
    ],
    en: [
      { q: 'What is the purpose of a Certificate of Origin?', a: 'A Certificate of Origin certifies where goods were manufactured. It is essential for customs duty assessment, trade policy implementation, and enjoying preferential tariff treatment under free trade agreements.' },
      { q: 'Who issues a Certificate of Origin?', a: 'Certificates of Origin are typically issued by the exporter\'s national chamber of commerce (such as CCPIT in China) or customs authorities. Chinese exporters can apply through local CCPIT or customs offices.' }
    ]
  },
  bill_of_lading: {
    zh: [
      { q: '提单(Bill of Lading)有哪三种类型？', a: '提单按物权转移方式分为：记名提单（不可转让）、指示提单（通过背书转让）、不记名提单（持单人可提货）。按运输方式又分为海运提单和空运提单。' },
      { q: '提单和海运单(Sea Waybill)有什么区别？', a: '提单是物权凭证，可以转让和用于信用证结汇；海运单不是物权凭证，不能转让，货物到达目的港后收货人凭身份证明即可提货，适用于信用证外的交易。' }
    ],
    en: [
      { q: 'What are the three types of Bill of Lading?', a: 'Bills of Lading are classified by transferability: Straight B/L (non-transferable), Order B/L (transferable by endorsement), and Bearer B/L (transferable by possession). They are also classified by transport mode: Ocean B/L and Air Waybill.' },
      { q: 'What is the difference between Bill of Lading and Sea Waybill?', a: 'A Bill of Lading is a document of title that can be transferred and used for L/C settlement. A Sea Waybill is NOT a title document, cannot be transferred, and goods are released to the consignee upon identity verification at the destination port.' }
    ]
  },
  insurance_policy: {
    zh: [
      { q: '货运保险有哪些基本险别？', a: '国际货运保险主要包括：平安险(FPA，仅保重大损失)、水渍险(WA，保海水损坏)、一切险(All Risks，保全部损失)。附加险包括战争险、罢工险、偷窃险等。' },
      { q: '保险金额如何确定？', a: '保险金额通常按发票金额的110%计算（CIF价加10%），以覆盖货物在运输过程中可能发生的损失和相关费用。具体比例可根据合同约定调整。' }
    ],
    en: [
      { q: 'What are the basic cargo insurance coverage types?', a: 'International cargo insurance mainly includes: FPA (Free from Particular Average, major losses only), WA (With Average, covers seawater damage), and All Risks (covers all losses). Additional coverage includes war risk, strike risk, theft risk, etc.' },
      { q: 'How to determine the insured amount?', a: 'The insured amount is typically calculated as 110% of the invoice value (CIF price plus 10%), to cover potential losses and related expenses during transit. The exact percentage can be adjusted per contract terms.' }
    ]
  },
  customs_declaration: {
    zh: [
      { q: '报关单由谁来填写申报？', a: '报关单通常由出口企业的报关员或委托专业报关行填写。申报人需具备报关资质，熟悉海关法规和商品归类规则，确保申报信息准确。' },
      { q: 'HS编码在报关中有什么作用？', a: 'HS编码(Harmonized System Code)是国际通用的商品分类编码，用于确定商品的关税税率、监管条件和贸易政策。正确归类HS编码是报关成功的关键。' }
    ],
    en: [
      { q: 'Who fills out a Customs Declaration?', a: 'Customs Declarations are typically completed by the exporter\'s customs broker or a professional customs clearance agency. The declarant must have customs clearance qualifications and knowledge of tariff classification and regulations.' },
      { q: 'What is the role of HS Code in customs declaration?', a: 'The HS Code (Harmonized System Code) is an internationally standardized product classification code used to determine tariff rates, regulatory requirements, and trade policies. Correct HS Code classification is essential for successful customs clearance.' }
    ]
  },
  inspection_certificate: {
    zh: [
      { q: '检验证书(Inspection Certificate)由谁出具？', a: '检验证书由第三方检验机构（如SGS、BV、Intertek等）或买卖双方约定的检验人员出具。部分国家要求由政府指定的检验机构签发。' },
      { q: '检验证书的有效期是多久？', a: '检验证书通常没有固定有效期，但大多数进口国要求在货物到达后的一定时间内完成清关（通常30-90天）。建议按信用证或合同要求执行。' }
    ],
    en: [
      { q: 'Who issues an Inspection Certificate?', a: 'Inspection Certificates are issued by independent inspection agencies (such as SGS, BV, Intertek) or inspectors agreed upon by both parties. Some countries require certificates from government-designated inspection bodies.' },
      { q: 'What is the validity period of an Inspection Certificate?', a: 'Inspection Certificates typically do not have a fixed expiry date, but most importing countries require customs clearance within a specified period after goods arrival (usually 30-90 days). Follow L/C or contract requirements.' }
    ]
  },
  fumigation_certificate: {
    zh: [
      { q: '什么货物需要熏蒸证书(Fumigation Certificate)？', a: '使用实木包装材料（如木箱、木托盘、木垫板）的货物需要熏蒸处理并出具证书，以防止有害生物跨境传播。部分国家对所有木质包装强制执行ISPM 15标准。' },
      { q: '熏蒸处理的常用方法有哪些？', a: '常用熏蒸方法包括：溴甲烷熏蒸、热处理（56°C持续30分钟）、硫酰氟熏蒸。处理后需在规定时间后检测残留气体浓度，合格后方可出具证书。' }
    ],
    en: [
      { q: 'When is a Fumigation Certificate required?', a: 'Fumigation is required for goods shipped with solid wood packaging (wooden crates, pallets, dunnage) to prevent cross-border pest transmission. Many countries enforce ISPM 15 standards for all wood packaging materials.' },
      { q: 'What are common fumigation methods?', a: 'Common methods include: methyl bromide fumigation, heat treatment (56°C for 30 minutes), and sulfuryl fluoride fumigation. After treatment, residual gas concentration must be tested and certified as safe before issuing the certificate.' }
    ]
  },
  beneficiary_certificate: {
    zh: [
      { q: '受益人证明(Beneficiary Certificate)什么时候需要？', a: '受益人证明通常在信用证交易中，由受益人（卖方）出具，证明已按信用证要求完成特定操作（如寄送单据副本、通知发货等）。是信用证交单的组成部分。' },
      { q: '受益人证明和信用证(L/C)的关系？', a: '受益人证明是信用证要求的交单单据之一。如果信用证条款规定需要提供受益人证明，卖方必须严格按照信用证要求的格式和内容出具，否则构成不符点。' }
    ],
    en: [
      { q: 'When is a Beneficiary Certificate needed?', a: 'A Beneficiary Certificate is typically required in L/C transactions, issued by the beneficiary (seller) to certify that specific actions have been completed as per L/C terms (e.g., sending document copies, notifying shipment). It is part of the L/C document presentation.' },
      { q: 'What is the relationship between Beneficiary Certificate and Letter of Credit?', a: 'A Beneficiary Certificate is one of the documents required by the L/C. If the L/C terms stipulate a Beneficiary Certificate, the seller must issue it strictly in the format and content specified, otherwise it constitutes a discrepancy.' }
    ]
  },
  shipper_letter_instruction: {
    zh: [
      { q: '发货人委托书(SLI)给谁使用？', a: '发货人委托书是发货人（出口商）向货运代理提供的书面运输指示，用于委托货代安排订舱、报关、装运等物流操作。是货代出具提单的依据。' },
      { q: 'SLI包含哪些运输指示？', a: 'SLI包含发货人和收货人信息、起运港和目的港、货物描述、件数、重量、体积、运费预付/到付、提单类型、保险要求、特殊处理指示等。' }
    ],
    en: [
      { q: 'Who uses a Shipper\'s Letter of Instruction (SLI)?', a: 'An SLI is a written instruction from the shipper (exporter) to the freight forwarder, authorizing them to arrange booking, customs clearance, loading, and other logistics operations. It serves as the basis for the forwarder to issue the Bill of Lading.' },
      { q: 'What shipping directives are included in an SLI?', a: 'An SLI includes shipper and consignee information, ports of loading and destination, cargo descriptions, piece count, weights, volumes, freight prepaid/collect, B/L type, insurance requirements, and special handling instructions.' }
    ]
  },
  commercial_packing_list: {
    zh: [
      { q: '详细装箱单(Commercial Packing List)和普通装箱单有什么区别？', a: '详细装箱单比标准装箱单包含更精细的包装信息，如每个包装箱的具体内容物、内件编号、尺寸规格、堆放要求、危险品标识等，适合复杂货物和定制化包装。' },
      { q: '详细装箱单如何计算CBM体积？', a: 'CBM(Cubic Meter)计算公式为：长(m)×宽(m)×高(m)×件数。详细装箱单会自动累加每箱体积得出总体积，用于确定集装箱装载量和运费。' }
    ],
    en: [
      { q: 'What is the difference between Commercial Packing List and basic Packing List?', a: 'A Commercial Packing List contains more detailed packaging information than a standard Packing List, such as specific contents per carton, inner item numbers, dimensional specifications, stacking requirements, and hazardous material labels — suitable for complex or customized shipments.' },
      { q: 'How to calculate CBM in a Commercial Packing List?', a: 'CBM (Cubic Meter) is calculated as: length(m) × width(m) × height(m) × number of pieces. The Commercial Packing List automatically sums per-carton volumes to determine total container load capacity and freight costs.' }
    ]
  },
  currency_converter: {
    zh: [
      { q: '汇率需要手动输入吗？', a: '汇率需手动输入或根据实时汇率更新。工具本身不自动获取实时汇率，建议参考中国银行、XE.com或其他权威汇率源的数据。' },
      { q: '汇率换算支持哪些货币？', a: '支持主要国际贸易货币，包括USD、EUR、GBP、JPY、CNY、AUD、CAD、CHF、HKD、SGD、KRW等，可根据需要自定义添加。' }
    ],
    en: [
      { q: 'Do I need to input exchange rates manually?', a: 'Yes, exchange rates must be entered manually or updated from real-time sources. The tool does not auto-fetch live rates. We recommend referencing Bank of China, XE.com, or other authoritative rate sources.' },
      { q: 'Which currencies are supported for conversion?', a: 'Major international trade currencies are supported, including USD, EUR, GBP, JPY, CNY, AUD, CAD, CHF, HKD, SGD, KRW, and more — customizable as needed.' }
    ]
  },
  invoice_number: {
    zh: [
      { q: '发票编号可以自定义规则吗？', a: '支持多种编号规则：按日期(YYYYMMDD-XXX)、按前缀+序号(CI-0001)、自定义格式等。可设置起始序号和递增步长。' },
      { q: '发票编号可以按天/月/年重置吗？', a: '支持按日期自动重置。选择"按日期"模式时，编号会在每天/每月/每年自动从零开始，确保编号的唯一性和可读性。' }
    ],
    en: [
      { q: 'Can I customize invoice number rules?', a: 'Multiple numbering rules are supported: by date (YYYYMMDD-XXX), by prefix + sequence (CI-0001), custom formats, etc. You can set the starting number and increment step.' },
      { q: 'Can invoice numbers be reset daily/monthly/yearly?', a: 'Yes, automatic date-based reset is supported. In "by date" mode, numbers reset from zero daily/monthly/yearly, ensuring uniqueness and readability.' }
    ]
  },
  shipping_mark: {
    zh: [
      { q: '唛头(Shipping Mark)有几种样式可选？', a: '支持标准唛头（含收发货人、目的港、件号等）和菱形唛头两种样式。可根据目的港要求和客户偏好选择，支持自定义内容。' },
      { q: '唛头必须包含哪些信息？', a: '标准唛头通常包含：收货人简称/代码、目的港名称、合同号或订单号、箱号/件号。部分客户要求添加原产地、重量、尺寸等额外信息。' }
    ],
    en: [
      { q: 'How many shipping mark styles are available?', a: 'Two styles are supported: Standard Mark (with consignee, destination port, piece number, etc.) and Diamond Mark. Choose based on destination port requirements and customer preferences. Custom content is also supported.' },
      { q: 'What information must a shipping mark contain?', a: 'A standard shipping mark typically includes: consignee abbreviation/code, destination port name, contract or order number, and carton/piece number. Some customers require additional info such as country of origin, weight, and dimensions.' }
    ]
  },
  payment_calculator: {
    zh: [
      { q: '付款计算器支持哪些付款方式？', a: '支持T/T电汇（前T/T、后T/T）、L/C信用证、D/P付款交单、D/A承兑交单、30%定金+70%尾款等常见外贸付款方式。' },
      { q: '30/70付款方式怎么计算？', a: '30/70表示买方预付30%定金，剩余70%在发货后或见提单副本支付。计算器会自动算出定金金额和尾款金额，方便报价和收款。' }
    ],
    en: [
      { q: 'What payment methods does the Payment Calculator support?', a: 'It supports common trade payment methods: T/T (advance T/T, deferred T/T), L/C (Letter of Credit), D/P (Documents against Payment), D/A (Documents against Acceptance), and 30% deposit + 70% balance.' },
      { q: 'How does 30/70 payment work?', a: '30/70 means the buyer pays 30% as advance deposit, with the remaining 70% paid after shipment or upon receiving the B/L copy. The calculator automatically computes the deposit and balance amounts for quoting and collection.' }
    ]
  }
};

function injectPageFaq() {
  if (document.getElementById('page-faq-section')) return;
  var dt = typeof DT !== 'undefined' ? DT : null;
  if (!dt) return;
  var lang = getLang();
  var isZh = lang === 'zh';
  var main = document.querySelector('main');
  if (!main) return;

  var general = FAQ_GENERAL[isZh ? 'zh' : 'en'];
  var specific = FAQ_DOC_SPECIFIC[dt] && FAQ_DOC_SPECIFIC[dt][isZh ? 'zh' : 'en'];
  var allFaqs = general.concat(specific || []);
  if (allFaqs.length === 0) return;

  var faqHtml = '<section id="page-faq-section" class="faq-section">'
    + '<h2>' + (isZh ? '常见问题 / FAQ' : 'Frequently Asked Questions') + '</h2>'
    + '<div class="faq-list">';
  allFaqs.forEach(function(faq) {
    faqHtml += '<div class="faq-item">'
      + '<div class="faq-question" onclick="this.parentElement.classList.toggle(\'open\')">'
      + faq.q + '<span class="faq-arrow">&#9654;</span></div>'
      + '<div class="faq-answer">' + faq.a + '</div></div>';
  });
  faqHtml += '</div></section>';
  main.insertAdjacentHTML('beforeend', faqHtml);

  // Inject FAQPage JSON-LD
  var ldScript = document.createElement('script');
  ldScript.type = 'application/ld+json';
  ldScript.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': allFaqs.map(function(faq) {
      return { '@type': 'Question', 'name': faq.q, 'acceptedAnswer': { '@type': 'Answer', 'text': faq.a } };
    })
  });
  document.head.appendChild(ldScript);
}

function t(zh, en) {
  return getLang() === 'zh' ? zh : en;
}

// ===== Default Document Factories =====
function getDefaultDoc(dt) {
  const empty = getEmptyItem(dt);
  switch(dt) {
    case 'commercial_invoice': return {
      logo:'', shipperName:'', shipperAddress:'', shipperPhone:'', shipperTaxId:'',
      consigneeName:'', consigneeCompany:'', consigneeAddress:'', consigneePhone:'', consigneeTaxId:'',
      importerName:'', importerAddress:'', importerPhone:'', importerTaxId:'',
      invoiceNo:'', poNo:'', dateOfExport:'', waybillNo:'', reasonForExport:'commercial',
      paymentTerms:'', currency:'USD', lCNo:'', exportCountry:'', destinationCountry:'',
      items:[empty], totalPkgs:'', totalWeight:'', totalInvoiceValue:'',
      declaration:'I DECLARE ALL THE INFORMATION CONTAINED IN THE INVOICE TO BE TRUE AND CORRECT.',
      footerNote:'NOTE: All shipments must be accompanied by an International Air Waybill and two duplicate copies of CI.',
      signatureName:'', signatureTitle:'', signatureDate:''
    };
    case 'cost_estimation': return {
      projectRef:'', preparationDate:'', preparedBy:'', companyName:'', companyAddress:'', contactPhone:'',
      clientName:'', clientCompany:'', clientAddress:'', productName:'', productSpec:'',
      currency:'USD', validityPeriod:'', items:[empty],
      subtotalCost:'', profitMargin:'10', taxRate:'13', discountRate:'0',
      profitAmount:'', taxAmount:'', discountAmount:'', grandTotal:'',
      termsAndConditions:'Standard terms and conditions apply.',
      signatureName:'', signatureTitle:'', signatureDate:''
    };
    case 'commercial_quotation': return {
      logo:'', quotationNo:'', quotationDate:'', validityPeriod:'', currency:'USD',
      sellerName:'', sellerCompany:'', sellerAddress:'', sellerPhone:'', sellerEmail:'', sellerTaxId:'',
      buyerName:'', buyerCompany:'', buyerAddress:'', buyerPhone:'', buyerEmail:'', buyerTaxId:'',
      paymentTerms:'', deliveryTerms:'', leadTime:'', minOrderQty:'',
      items:[empty], subtotal:'', totalDiscount:'', totalTax:'', grandTotal:'',
      termsAndConditions:'This quotation is valid until the date specified above.',
      remarks:'', signatureName:'', signatureTitle:'', signatureDate:''
    };
    case 'packing_list': return {
      logo:'', shipperName:'', shipperAddress:'', shipperPhone:'',
      consigneeName:'', consigneeCompany:'', consigneeAddress:'', consigneePhone:'',
      invoiceNo:'', poNo:'', dateOfExport:'', waybillNo:'',
      vessel:'', portOfLoading:'', portOfDischarge:'',
      items:[empty], totalPkgs:'', totalNetWeight:'', totalGrossWeight:'', totalMeasurement:''
    };
    case 'proforma_invoice': return {
      logo:'', sellerName:'', sellerAddress:'', sellerPhone:'', sellerTaxId:'',
      buyerName:'', buyerCompany:'', buyerAddress:'', buyerPhone:'', buyerTaxId:'',
      proformaInvoiceNo:'', poNo:'', dateOfIssue:'', validityPeriod:'',
      lCNo:'', waybillNo:'', currency:'USD', paymentTerms:'T/T',
      countryOfExport:'', destinationCountry:'',
      items:[empty], totalPkgs:'', totalWeight:'', totalInvoiceValue:'',
      declaration:'This proforma invoice is issued for the purpose of obtaining import license and/or opening L/C.',
      signatureName:'', signatureTitle:'', signatureDate:''
    };
    case 'trade_contract': return {
      logo:'', contractNo:'', dateOfSigning:'', placeOfSigning:'',
      sellerName:'', sellerCompany:'', sellerAddress:'', sellerPhone:'', sellerEmail:'', sellerTaxId:'',
      buyerName:'', buyerCompany:'', buyerAddress:'', buyerPhone:'', buyerEmail:'', buyerTaxId:'',
      currency:'USD', paymentTerms:'', deliveryTerms:'', shipmentDate:'',
      portOfLoading:'', portOfDischarge:'',
      insuranceTerms:'', inspectionTerms:'', forceMajeure:'', arbitrationTerms:'',
      items:[empty], totalAmount:'', penaltyClause:'',
      sellerSignatureName:'', sellerSignatureTitle:'', sellerSignatureDate:'',
      buyerSignatureName:'', buyerSignatureTitle:'', buyerSignatureDate:''
    };
    case 'shipping_mark': return {
      consigneeName:'', destinationPort:'', poNumber:'',
      packageNumberStart:'1', packageNumberEnd:'1',
      itemDescription:'', specification:'', netWeight:'', grossWeight:'',
      countryOfOrigin:'China',
      dimensionL:'', dimensionW:'', dimensionH:'',
      customLine1:'', customLine2:'', customLine3:'', customLine4:'', customLine5:'',
      markStyle:'standard'
    };
    case 'currency_converter': return {
      baseCurrency:'USD', targetCurrency:'CNY', exchangeRate:'', amount:'', convertedAmount:'',
      items:[{fromCurrency:'USD', toCurrency:'CNY', rate:'', amount:'', result:''}]
    };
    case 'certificate_of_origin': return {
      exporterName:'', exporterAddress:'', exporterCountry:'',
      consigneeName:'', consigneeAddress:'', consigneeCountry:'',
      meansOfTransport:'', portOfLoading:'', portOfDischarge:'', vessel:'',
      countryOfOrigin:'', destinationCountry:'',
      invoiceNo:'', dateOfExport:'',
      items:[empty],
      declaration:'The undersigned hereby declares that the above details are correct and that the goods described herein originate from the country specified.',
      certifyingAuthority:'', certifyingLocation:'', certifyingDate:''
    };
    case 'payment_calculator': return {
      contractValue:'', currency:'USD',
      advancePct:'30', shipmentPct:'70', balancePct:'0', balanceDays:'0',
      advanceAmount:'', shipmentAmount:'', balanceAmount:'', preset:'2'
    };
    case 'invoice_number': return {
      prefix:'INV', separator:'-', dateFormat:'YYYYMMDD', sequenceDigits:4, resetRule:'monthly',
      numbers:[]
    };
    case 'bill_of_lading': return {
      shipperName:'', shipperAddress:'',
      consigneeName:'', consigneeAddress:'',
      notifyPartyName:'', notifyPartyAddress:'',
      vessel:'', voyageNo:'', portOfLoading:'', portOfDischarge:'',
      placeOfReceipt:'', placeOfDelivery:'',
      blNo:'', shipperRef:'', bookingNo:'',
      freightTerms:'Prepaid', currency:'USD',
      dateOfShipment:'', dateOfIssue:'',
      items:[empty], totalPkgs:'', totalGrossWeight:'', totalMeasurement:'',
      declaration:'The shipper hereby declares that the goods described herein are correctly described.',
      carrierName:'', carrierSignatureDate:''
    };
    case 'insurance_policy': return {
      insuredName:'', insuredAddress:'',
      beneficiaryName:'', beneficiaryAddress:'',
      policyNo:'', invoiceNo:'', contractNo:'', dateOfInsurance:'',
      voyageFrom:'', voyageTo:'',
      meansOfTransport:'By Sea', vessel:'',
      insuranceConditions:'All Risks', insuranceClauses:'PICC Ocean Marine Cargo Clauses',
      currency:'USD', totalInsuredAmount:'', premiumRate:'0.3', premiumAmount:'',
      items:[empty],
      declaration:'This is to certify that the above mentioned goods are insured against All Risks.',
      insurerName:'', signatureDate:''
    };
    case 'customs_declaration': return {
      declarantName:'', declarantCode:'', declarantPhone:'',
      shipperName:'', consigneeName:'',
      tradeMode:'General Trade', customsPort:'',
      contractNo:'', invoiceNo:'', blNo:'',
      dateOfDeclaration:'', dateOfExport:'',
      transportMode:'Sea', vessel:'',
      currency:'USD', paymentTerms:'T/T',
      items:[empty], totalValue:'', totalWeight:'',
      declaration:'I hereby declare that the information provided is true and accurate.',
      declarantSignature:'', signatureDate:''
    };
    case 'inspection_certificate': return {
      applicantName:'', applicantAddress:'',
      manufacturerName:'', manufacturerAddress:'',
      consigneeName:'', consigneeAddress:'',
      certificateNo:'', invoiceNo:'', contractNo:'',
      dateOfInspection:'', dateOfIssue:'',
      inspectionStandard:'ISO 9001', inspectionLocation:'', inspectionResult:'Passed',
      vessel:'', portOfLoading:'', portOfDischarge:'',
      countryOfOrigin:'', destinationCountry:'',
      items:[empty],
      declaration:'We hereby certify that the goods have been inspected and found to be in conformity with the contract specifications.',
      inspectorName:'', certifyingAuthority:'', signatureDate:''
    };
    case 'fumigation_certificate': return {
      shipperName:'', shipperAddress:'', consigneeName:'', consigneeAddress:'',
      commodityName:'', commodityDescription:'',
      numberOfPkgs:'', typeOfPackaging:'Wooden Pallet',
      grossWeight:'', volume:'',
      fumigant:'Methyl Bromide', fumigationMethod:'Gas Fumigation',
      fumigationTemperature:'25°C', fumigationDuration:'24 hours',
      fumigationDate:'', fumigationLocation:'',
      fumigatorName:'', fumigatorLicense:'',
      vessel:'', portOfLoading:'', portOfDischarge:'',
      countryOfOrigin:'', destinationCountry:'',
      certificateNo:'', invoiceNo:'', dateOfIssue:'',
      declaration:'We hereby certify that the above goods have been fumigated and are free from pests.'
    };
    case 'beneficiary_certificate': return {
      beneficiaryName:'', beneficiaryAddress:'',
      consigneeName:'', consigneeAddress:'',
      lcNo:'', invoiceNo:'', contractNo:'', dateOfIssue:'',
      issuingBank:'', vessel:'',
      portOfLoading:'', portOfDischarge:'',
      countryOfOrigin:'', destinationCountry:'', shipmentDate:'',
      goodsDescription:'', certificateType:'Quality',
      declaration:'We hereby certify that the goods shipped under the above L/C are in conformity with the contract.',
      beneficiarySignature:'', signatureDate:''
    };
    case 'shipper_letter_instruction': return {
      shipperName:'', shipperAddress:'', shipperPhone:'', shipperEmail:'', shipperTaxId:'',
      consigneeName:'', consigneeCompany:'', consigneeAddress:'', consigneePhone:'',
      notifyPartyName:'', notifyPartyAddress:'',
      forwarderName:'', forwarderContact:'',
      shipmentDate:'', vessel:'',
      portOfLoading:'', portOfDischarge:'',
      blType:'Original', currency:'USD', paymentTerms:'T/T',
      insuranceRequired:false, insuranceValue:'', specialInstructions:'',
      items:[empty], totalValue:'', totalWeight:'', totalPkgs:'',
      shipperSignature:'', signatureDate:''
    };
    case 'commercial_packing_list': return {
      shipperName:'', shipperCompany:'', shipperAddress:'',
      consigneeName:'', consigneeCompany:'', consigneeAddress:'',
      invoiceNo:'', poNo:'', contractNo:'',
      dateOfPacking:'', dateOfExport:'',
      vessel:'', portOfLoading:'', portOfDischarge:'',
      shippingMark:'', containerNo:'', sealNo:'',
      items:[empty], totalPkgs:'', totalNetWeight:'', totalGrossWeight:'', totalMeasurement:'',
      packingRemarks:'', preparerName:'', preparerTitle:'', signatureDate:''
    };
    default: return {};
  }
}

function getEmptyItem(dt) {
  switch(dt) {
    case 'commercial_invoice': return {marks:'',noOfPkgs:'',typeOfPackaging:'',countryOfOrigin:'',description:'',hsCode:'',qty:'',unitOfMeasure:'',weight:'',unitValue:'',totalValue:''};
    case 'cost_estimation': return {itemName:'',specification:'',quantity:'',unitCost:'',totalCost:'',notes:''};
    case 'commercial_quotation': return {itemNo:'',description:'',specification:'',quantity:'',unitOfMeasure:'',unitPrice:'',discount:'',lineTotal:''};
    case 'packing_list': return {marks:'',noOfPkgs:'',typeOfPackaging:'',description:'',qty:'',unitOfMeasure:'',netWeight:'',grossWeight:'',measurement:''};
    case 'proforma_invoice': return {itemNo:'',marks:'',description:'',hsCode:'',qty:'',unitOfMeasure:'',unitPrice:'',totalAmount:''};
    case 'trade_contract': return {itemNo:'',description:'',specification:'',qty:'',unitOfMeasure:'',unitPrice:'',totalAmount:''};
    case 'certificate_of_origin': return {marks:'',numberOfPkgs:'',description:'',hsCode:'',grossWeight:'',quantity:''};
    case 'bill_of_lading': return {marks:'',numberOfPkgs:'',description:'',grossWeight:'',measurement:'',freight:''};
    case 'insurance_policy': return {marks:'',numberOfPkgs:'',description:'',hsCode:'',quantity:'',insuredAmount:''};
    case 'customs_declaration': return {itemNo:'',hsCode:'',description:'',specification:'',quantity:'',unitOfMeasure:'',unitPrice:'',totalAmount:'',originCountry:'',destinationCountry:'',netWeight:'',grossWeight:''};
    case 'inspection_certificate': return {itemNo:'',description:'',specification:'',quantity:'',unitOfMeasure:'',batchNo:''};
    case 'shipper_letter_instruction': return {description:'',hsCode:'',quantity:'',unitOfMeasure:'',weight:'',value:''};
    case 'commercial_packing_list': return {itemNo:'',description:'',specification:'',numberOfPkgs:'',typeOfPackaging:'',qtyPerPkg:'',totalQty:'',unitOfMeasure:'',netWeightPerPkg:'',grossWeightPerPkg:'',totalNetWeight:'',totalGrossWeight:'',dimensionL:'',dimensionW:'',dimensionH:'',measurementCBM:''};
    default: return {};
  }
}

// ===== Auto-calculation for items =====
function autoCalcItem(dt, item) {
  if (!item) return;
  switch(dt) {
    case 'commercial_invoice':
      if (item.qty && item.unitValue) item.totalValue = (parseFloat(item.qty) * parseFloat(item.unitValue) || 0).toFixed(2);
      break;
    case 'cost_estimation':
      item.totalCost = ((parseFloat(item.quantity)||0) * (parseFloat(item.unitCost)||0)).toFixed(2);
      break;
    case 'commercial_quotation':
      item.lineTotal = ((parseFloat(item.quantity)||0) * (parseFloat(item.unitPrice)||0) - (parseFloat(item.discount)||0)).toFixed(2);
      break;
    case 'proforma_invoice':
    case 'trade_contract':
      if (item.qty && item.unitPrice) item.totalAmount = (parseFloat(item.qty) * parseFloat(item.unitPrice) || 0).toFixed(2);
      break;
    case 'commercial_packing_list':
      item.totalQty = ((parseFloat(item.qtyPerPkg)||0) * (parseFloat(item.numberOfPkgs)||0)).toFixed(0);
      item.totalNetWeight = ((parseFloat(item.netWeightPerPkg)||0) * (parseFloat(item.numberOfPkgs)||0)).toFixed(2);
      item.totalGrossWeight = ((parseFloat(item.grossWeightPerPkg)||0) * (parseFloat(item.numberOfPkgs)||0)).toFixed(2);
      if (item.dimensionL && item.dimensionW && item.dimensionH) {
        item.measurementCBM = ((parseFloat(item.dimensionL)||0) * (parseFloat(item.dimensionW)||0) * (parseFloat(item.dimensionH)||0) / 1000000 * (parseFloat(item.numberOfPkgs)||0)).toFixed(4);
      }
      break;
  }
}

// ===== PDF Export =====
function doExportPdf(dt, data, previewElId) {
  if (typeof html2pdf === 'undefined') {
    alert('PDF library not loaded. Please check your internet connection.');
    return;
  }
  const el = document.getElementById(previewElId);
  if (!el) return;

  const prefix = PDF_PREFIX[dt] || 'document';
  const ref = getDocRef(dt, data);
  const filename = prefix + (ref ? '_' + ref : '') + '.pdf';

  const lang = getLang();
  const genText = lang === 'zh' ? '生成中...' : 'Generating...';

  // Show loading state
  const btn = document.querySelector('[data-pdf-btn]');
  if (btn) { btn.disabled = true; btn.textContent = genText; }

  const opt = {
    margin: [5, 5, 5, 5],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
  };

  html2pdf().set(opt).from(el).save().then(() => {
    // Save snapshot after export
    addSnapshot(dt, ref, data);
    if (btn) { btn.disabled = false; const tr = I18N[lang]; btn.textContent = tr.exportPdf; }
  }).catch(() => {
    if (btn) { btn.disabled = false; const tr = I18N[lang]; btn.textContent = tr.exportPdf; }
  });
}

function getDocRef(dt, data) {
  switch(dt) {
    case 'commercial_invoice': return data.invoiceNo;
    case 'cost_estimation': return data.projectRef;
    case 'commercial_quotation': return data.quotationNo;
    case 'packing_list': return data.invoiceNo;
    case 'proforma_invoice': return data.proformaInvoiceNo;
    case 'trade_contract': return data.contractNo;
    case 'certificate_of_origin': return data.invoiceNo;
    case 'bill_of_lading': return data.blNo;
    case 'insurance_policy': return data.policyNo;
    case 'customs_declaration': return data.invoiceNo;
    case 'inspection_certificate': return data.certificateNo;
    case 'fumigation_certificate': return data.certificateNo;
    case 'beneficiary_certificate': return data.lcNo;
    case 'shipper_letter_instruction': return data.forwarderName;
    case 'commercial_packing_list': return data.invoiceNo;
    default: return '';
  }
}

// ===== Load/Save document data =====
function loadDocData(dt) {
  try {
    const raw = localStorage.getItem(userKey('doc_data_' + dt));
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}
function saveDocData(dt, data) {
  try { localStorage.setItem(userKey('doc_data_' + dt), JSON.stringify(data)); } catch(e) {}
}
function clearDocData(dt) {
  try { localStorage.removeItem(userKey('doc_data_' + dt)); } catch(e) {}
}

// ===== Utility helpers =====
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}
function formatDateTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  const seq = String(Math.floor(Math.random()*9000)+1000);
  return 'INV' + '-' + y + m + d + '-' + seq;
}
