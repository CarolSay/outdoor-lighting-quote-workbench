# 酷睿创显 · 户外照明报价工作台 V5

> 面向 LED 户外照明行业的一站式报价管理系统：客户管理、产品库、智能报价、Excel 导入/导出、邮件收发，全流程数字化。

## 功能概览

| 模块 | 核心能力 |
|------|---------|
| **快速报价** | 选客户→选产品→输入数量→自动算价→一键导出 Excel |
| **报价管理** | 版本链（草稿/审核/发送/作废）、版本对比、PDF/Excel 导出 |
| **客户管理** | 客户档案、联系人、地址、币种、关联报价 |
| **产品库** | 100+ LED 灯具产品，27+ 结构化字段（电气/光学/控制/结构/防护/认证/商业），支持 ext1/ext2/ext3 扩展字段 |
| **项目跟踪** | 按项目分组报价，批量状态流转 |
| **报价历史** | 全字段筛选（客户/编号/来源/日期），导入溯源 |
| **Excel 导入** | 扫描文件夹（xlsx/xls/pdf），自动识别报价单/PI 发票，提取产品+客户+联系人，写入报价历史 |
| **邮件收发** | IMAP 收件 + SMTP 发件，支持文件导入收件人、正则提取邮箱地址 |

## 技术栈

- **后端**：Python 3.10+，标准库 `http.server` + `sqlite3`（零框架依赖）
- **前端**：原生 HTML/CSS/JavaScript（单页应用，无构建工具）
- **Excel 解析**：openpyxl + xlrd
- **PDF 解析**：pypdf
- **邮件协议**：IMAP（收件）+ SMTP SSL（发件）

## 快速开始

### 1. 安装依赖

```bash
pip install openpyxl xlrd pypdf
```

### 2. 启动服务

```bash
cd v5
python app.py
```

### 3. 访问系统

浏览器打开 http://127.0.0.1:5100

## 项目结构

```
v5/
├── app.py                    # 入口：HTTP 路由分发 + 静态文件
├── config.py                 # 配置管理（数据库/状态/参数）
├── db.py                     # 数据库连接、事务、查询封装
├── schema.py                 # 建表语句 + 字段定义
├── scheduler.py              # 定时任务（邮件拉取/备份）
├── requirements.txt          # Python 依赖
├── quotation_template.xlsx   # 报价单导出模板
├── outdoor_lighting.db       # SQLite 数据库（运行时生成）
├── routes/
│   ├── core.py               # 核心业务路由（客户/产品/报价/项目/导入）
│   ├── mail_routes.py        # 邮件路由（收件/发件/配置）
│   ├── backup_routes.py      # 备份/恢复路由
│   └── config_routes.py      # 系统配置路由
├── services/
│   ├── quotes.py             # 报价+Excel导入/导出核心逻辑
│   ├── spec_fields.py        # 产品字段解析/生成（31条规则）
│   ├── mail_svc.py           # 邮件收发服务
│   └── backup_svc.py        # 数据备份/恢复服务
├── templates/
│   ├── index.html            # 主页面
│   └── assets/
│       ├── common.js         # 公共工具函数
│       ├── history.js        # 报价历史页面
│       ├── mail.js           # 邮件页面
│       └── singleimport.js   # 导入页面
├── docs/
│   ├── 设计说明.md            # 架构设计文档
│   └── 测试报告.md            # 测试用例与结果
└── data/
    ├── exports/              # 导出的 Excel 文件
    └── backups/             # 数据库备份
```

## 数据库概览

| 表 | 记录数 | 说明 |
|----|--------|------|
| customers | 7 | 客户档案 |
| products | 100 | 产品库（27+ 结构化字段 + ext1-3 扩展） |
| quotations | 11 | 报价单 |
| quotation_items | 98 | 报价明细行 |
| quotation_history | 13 | 导入溯源记录 |
| quotation_versions | — | 版本链 |
| projects | 10 | 项目 |
| providers | 1 | 供应商 |
| emails | — | 邮件 |
| import_files | — | 导入文件记录 |

## 核心特性

### 智能 Excel/PDF 导入

1. **扫描文件夹**：递归扫描 xlsx/xls/pdf 文件
2. **自动分类**：识别报价单、PI 发票、合同
3. **提取数据**：客户名、联系人、电话、地址、产品明细
4. **去重机制**：文件 SHA256 哈希 + 商品名称+描述组合去重
5. **写入历史**：记录导入来源、文件位置、导入类型
6. **自动建品**：未匹配的产品自动创建，标记 `Imported` 系列

### 产品描述解析（31 条规则）

产品描述自动解析为结构化字段：

```
输入: "RD-FP-50A,DC24V,3W,6pcs RGBW 5050 SMD,DMX512,IP66,Cree chip,IK10"
输出: model=RD-FP-50A, voltage=DC24V, power=3W, led_count=6pcs,
      cct_color=RGBW, led=5050 SMD, control=DMX512, ip_rating=IP66,
      chip=Cree, ik_rating=IK10, ext1=(未匹配文本)
```

未匹配的文本存入 `ext1` 字段，`ext2`/`ext3` 留给用户手动填写额外描述。

### 报价版本管理

- 状态流转：草稿 → 审核 → 发送 → 成交/作废
- 版本链：同一报价单支持多版本对比
- 审核机制：提交审核后锁定，不可直接修改

### 邮件集成

- **IMAP 收件**：定时拉取未读邮件，智能识别手机号关联客户
- **SMTP 发件**：SSL 加密，支持多收件人
- **文件导入收件人**：上传 txt/csv/xlsx，正则提取邮箱地址
- **配置管理**：页面内配置 SMTP/IMAP 服务器、账号、授权码

## 配置说明

### 邮箱配置

| 字段 | 说明 | 示例 |
|------|------|------|
| SMTP 服务器 | 发件服务器 | smtp.163.com / mail.ledsyst.com |
| SMTP 端口 | 发件端口（SSL） | 465 |
| IMAP 服务器 | 收件服务器 | imap.163.com / mail.ledsyst.com |
| IMAP 端口 | 收件端口（SSL） | 993 |
| 邮箱账号 | 发件邮箱 | chris@ledsyst.com |
| 授权码/密码 | SMTP/IMAP 认证 | ****** |

> QQ 邮箱需在设置中开启 IMAP/SMTP 服务并生成授权码（非登录密码）。

## 测试

系统包含 104+ 自动化测试用例，覆盖：

- 报价版本链与审核流程
- 导入去重（文件哈希 + 产品名称+描述）
- 产品描述解析（31 条规则 + ext 扩展字段）
- 邮件发送（多收件人 + 文件导入）
- 边界测试（空值/重复/超长/特殊字符）

详见 [测试报告](docs/测试报告.md)。

## 部署

### 生产环境建议

1. 使用 Gunicorn / Waitress 等 WSGI 容器（需微调入口）
2. 配置 Nginx 反向代理
3. 定期备份数据库（系统内置每日 03:00 自动备份）
4. 配置邮件 IMAP 定时拉取

### 数据备份

- 自动备份：每日 03:00 执行，保留最近 7 份
- 手动备份：管理页面 → 备份 → 立即备份
- 恢复：上传 .db 备份文件即可恢复

## 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|---------|
| V5 | 2026-09-04 | 精简版发布：87→104 测试用例，新增邮件收发、ext 扩展字段、文件导入收件人 |

## License

MIT
