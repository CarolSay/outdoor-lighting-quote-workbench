# -*- coding: utf-8 -*-
"""产品字段体系与描述解析/生成。

字段分两层存储：
- 核心字段：products 表固定列（描述生成、报价/PI 渲染、常用筛选需要）
- 扩展字段：products.spec_json JSON 字典（九类清单中其余字段，UI 动态渲染）

FIELD_CATALOG 按九类分组定义全部字段，核心列标记 core=True。
build_description() 按真实 PI 风格生成描述；
parse_description() 从自由文本描述反解析字段，剩余文本进 notes，不丢信息。
"""
import re

# ---------------------------------------------------------------------------
# 字段目录：九类。(key, 中文名, 单位/示例, 是否核心固定列)
# ---------------------------------------------------------------------------
FIELD_CATALOG = [
    ('electrical', '⚡️ 电气参数', [
        ('voltage', '额定电压', 'AC220V / DC24V / AC100-277V', True),
        ('power', '额定功率', '9W / 15W / 48W', True),
        ('input_current', '输入电流', '240mA / 0.35A', False),
        ('power_factor', '功率因数', '≥0.9 / ≥0.95', False),
        ('frequency', '电源频率', '50/60Hz', False),
        ('thd', '总谐波失真', '≤10%', False),
        ('safety_class', '电气安全等级', 'Class I / II / III', False),
    ]),
    ('optical', '💡 光学参数', [
        ('cct', '色温', '2200K / 3000K / 6500K', True),
        ('luminous_flux', '光通量', '400-500lm / 800-1000lm', False),
        ('efficacy', '光效', '≥75lm/W / ≥135lm/W', False),
        ('cri', '显色指数', 'Ra≥80 / Ra≥90', False),
        ('beam_angle', '光束角', '10×45° / 15° / 24° / 120°', True),
        ('light_distribution', '配光曲线', '光强分布/等光强曲线', False),
        ('center_intensity', '中心光强', 'cd', False),
        ('wavelength', '波长(单色/RGB)', 'R:619-624nm', False),
        ('flicker', '频闪比', '%', False),
        ('brightness', '亮度', 'lm/m 或 cd/㎡', True),
    ]),
    ('color_control', '🎨 颜色与控制', [
        ('cct_color', '光色/颜色', 'RGB / RGBW / 单色(红绿蓝黄琥珀)', True),
        ('control', '控制协议', 'DMX512 / SPI / ON-OFF', True),
        ('control_mode', '控制方式', '常亮/调光/变色/追逐/分段', False),
        ('grayscale', '灰度等级', '8bit / 16bit', False),
        ('pixel_count', '像素点/分段数', '8段/米 / 16 pixels', True),
        ('data_cable', '数据线缆', 'CAT6 / 防水线', True),
        ('controller', '配套控制器', 'CM-MC-A1 等', True),
    ]),
    ('physical', '📏 物理与结构', [
        ('length_size', '外形尺寸', 'L1000×W30×H30 / φ105×55 / 50mm', True),
        ('weight', '净重/毛重', 'kg / g', True),
        ('material', '外壳材质', '压铸铝ADC12 / 铝型材6063', True),
        ('cover_material', '面罩材质', '钢化玻璃 / PC(透明/磨砂/乳白)', False),
        ('body_color', '灯体颜色/表面处理', 'White body / RAL9016 / 黑色', True),
        ('heat_sink', '散热结构', '鳍片式 / 导热灌注', False),
        ('led_count', '灯珠数量', '24PCS / 6pcs SMD', True),
        ('led_chip', '灯珠型号/封装', 'SMD2835 / SMD5050 / COB', True),
    ]),
    ('environment', '🌧️ 环境与防护', [
        ('ip_rating', '防护等级', 'IP20 / IP65 / IP66 / IP67', True),
        ('ik_rating', 'IK防冲击等级', 'IK06 / IK08 / IK10', False),
        ('working_temperature', '工作环境温度', '-30℃～+45℃', True),
        ('storage_temperature', '储存环境温度', '-40℃～+85℃', True),
        ('surge_protection', '防雷/浪涌保护', '≥10KV', False),
        ('anti_sulfur', '防硫化处理', '是/否', False),
    ]),
    ('install_pack', '📦 安装与包装', [
        ('install_type', '安装方式', '壁挂/吸顶/地埋/嵌入式/支架式', False),
        ('connector', '对接方式', 'IP67防水插头 / 公母头 / 手拉手', False),
        ('cable_exit', '出线方式', '单端/双端/底部出线', False),
        ('pack_size', '包装尺寸', 'mm', False),
        ('pack_type', '包装方式', '纸盒 / 吸塑 / 珍珠棉+外箱', False),
        ('pcs_per_ctn', '每箱数量', 'PCS/CTN', False),
    ]),
    ('lifespan', '⏱️ 寿命与可靠性', [
        ('lifespan', '额定寿命', '≥30,000h / ≥50,000h', True),
        ('l70', '光通量维持率', 'L70≥50,000h', False),
        ('tj', '结温', 'Tj=85℃', False),
        ('temp_rise', '温升', '℃', False),
        ('switch_cycles', '开关次数', '次', False),
    ]),
    ('certification', '🏅 认证与标准', [
        ('certifications', '安全认证', 'CE / RoHS / UL / ETL / CCC / SAA / PSE', False),
        ('energy_grade', '能效等级', '一级 / 二级 / 三级', False),
        ('standards', '符合标准', 'GB7000.1 / IEC 60598', False),
    ]),
    ('commercial', '📄 商业与通用', [
        ('model', '产品型号', 'HTTL-3021D9W / CM-FP-50', True),
        ('product_name', '产品名称', 'LED洗墙灯 / linear light', True),
        ('category', '产品类别', '洗墙灯/线条灯/投光灯/点光源/控制器/电源/线缆/配件', True),
        ('series', '系列', 'Imported / 自定义', True),
        ('brand', '品牌/芯片品牌', 'CREE / OSRAM / LUMILEDS / 晶元', False),
        ('driver_brand', '电源品牌', '明纬 / 茂硕 / Chenglian', False),
        ('hs_code', 'HS编码', '9405429000 / 8537109090', True),
        ('moq', '起订量', 'PCS / m', False),
        ('currency', '货币单位', 'USD / RMB', False),
        ('standard_price_usd', '标准单价', 'USD', False),
        ('trade_terms', '贸易术语', 'FOB / CIF / EXW', False),
        ('cost_usd', '内部成本价', 'USD', False),
    ]),
]

# 核心固定列（products 表列名）
CORE_KEYS = [f[0] for _, _, fs in FIELD_CATALOG for f in fs if f[3]]
# 扩展字段（spec_json）
SPEC_KEYS = [f[0] for _, _, fs in FIELD_CATALOG for f in fs if not f[3]]
# 全部字段 key（校验用）
ALL_KEYS = CORE_KEYS + SPEC_KEYS

# 九类显示顺序与标签（前端用）
CATALOG_JSON = [{'key': g, 'label': lb,
                 'fields': [{'key': k, 'label': n, 'example': u, 'core': c} for k, n, u, c in fs]}
                for g, lb, fs in FIELD_CATALOG]

# 描述生成时每类字段顺序（仅核心字段参与，空值跳过）
_DESC_LINE1 = ['model', 'length_size', 'voltage', 'power', 'led_count', 'cct_color', 'control', 'ip_rating']
_DESC_LINE2 = ['pixel_count', 'beam_angle', 'material', 'body_color']


# ---------------------------------------------------------------------------
# 描述 → 字段
# ---------------------------------------------------------------------------
def _clean_rest(rest):
    """提取后剩余文本清理：压缩空白、去连续逗号、去空括号、去无内容行。"""
    rest = re.sub(r'[ \t]+', ' ', rest)
    lines = []
    for ln in rest.split('\n'):
        ln = re.sub(r'\(\s*\)', ' ', ln)                    # 空括号残片
        ln = re.sub(r'(?:\s*[,，]\s*){2,}', ', ', ln)       # ", ," -> ", "
        ln = re.sub(r'^[\s,，]+|[\s,，]+$', '', ln)          # 行首尾逗号
        if ln and re.search(r'[A-Za-z0-9\u4e00-\u9fa5]', ln):
            lines.append(ln)
    return '\n'.join(lines)


def parse_description(desc):
    """从自由文本描述解析结构化字段。返回 dict(含 notes)；未命中字段不出现。"""
    text = (desc or '').replace('\r', '').strip()
    out = {}
    if not text:
        return out
    rest = text

    def take(pattern, key, flags=re.I, join='/', group=0):
        """把 rest 中所有命中提取到 out[key]（join 连接多值），并从 rest 删除。"""
        nonlocal rest
        ms = re.findall(pattern, rest, flags)
        if not ms:
            return
        vals = []
        for m in ms:
            v = m if isinstance(m, str) else m[group]
            v = (v or '').strip().strip(',，')
            if v and v not in vals:
                vals.append(v)
        if vals:
            base = out.get(key)
            out[key] = join.join(([base] if base else []) + vals)
            rest = re.sub(pattern, ' ', rest, flags=flags)

    # 1) HS 编码（先提，防止数字被其他规则吞掉）
    m = re.search(r'hs\s*code\s*[,，:：]?\s*(\d{6,12})', rest, re.I)
    if m:
        out['hs_code'] = m.group(1)
        rest = rest[:m.start()] + ' ' + rest[m.end():]
    # 2) 型号：CM-FP-50 / CM-SC- / RD-FP-50A / ELG-300-24 / HTTL-3021D9W（大写字母开头带连字符）
    take(r'\b([A-Z]{2,6}-[A-Z0-9]+(?:-[A-Z0-9]+)*-?)', 'model', flags=0, group=1)
    # 3) 灯珠封装：SMD2835 / SMD5050；5050SMD 形式归一化为 SMD5050
    take(r'\bSMD(\d{4})\b', 'led_chip', group=1)
    if 'led_chip' in out:
        out['led_chip'] = 'SMD' + out['led_chip']
    take(r'\b(\d{4})SMD\b', 'led_chip', group=1)
    if out.get('led_chip') and out['led_chip'].isdigit():
        out['led_chip'] = 'SMD' + out['led_chip']
    take(r'\bCOB\b', 'led_chip')
    # 4) 尺寸：L1000*W37*H44mm / φ105×55mm / 50mm / 5m（线缆长度）
    take(r'\bL\d+(?:\.\d+)?(?:\s*[*×xX]\s*[WHX]?\d+(?:\.\d+)?){1,2}\s*mm\b', 'length_size')
    if 'length_size' not in out:
        take(r'[φΦ]\s*\d+(?:\.\d+)?(?:\s*[*×xX]\s*\d+(?:\.\d+)?)?\s*mm\b', 'length_size')
    if 'length_size' not in out:
        take(r'\b\d+(?:\.\d+)?\s*mm\b(?!\s*(?:for|with|to|by|per|of|x|in|at|length|long|wide|width|height)\b)', 'length_size')
    if 'length_size' not in out:
        take(r'\b\d+(?:\.\d+)?\s*m\b(?!\s*(?:for|with|to|by|per|of|x|in|at|length|long|wide|width|height)\b)', 'length_size')
    # 5) 电压：AC220V / DC24V / AC100-277V / DC48V / 24V（裸写法）
    take(r'\b[ACD]{2}\s?\d{2,3}(?:-\d{2,3})?V\b|\b\d{2,3}V\b', 'voltage')
    # 6) 功率：12W / 4.8W / 240W（独立词）
    take(r'\b\d+(?:\.\d+)?W\b(?!\d)', 'power')
    # 7) 灯珠数量：6pcs SMD / 6pcs / 3SMD / 60SMD / 48PCS（保留原始写法）
    take(r'\b\d+\s*pcs(?:\s*SMD\d*)?\b', 'led_count')
    take(r'\b\d+SMD\d*\b', 'led_count')
    # 8) 像素/分段：20pixels / 8段
    take(r'\b(\d+)\s*pixels?\b', 'pixel_count', group=1)
    take(r'\b(\d+)\s*段\b', 'pixel_count', flags=0, group=1)
    if out.get('pixel_count') and 'pixel' not in out['pixel_count'] and '段' not in out['pixel_count']:
        out['pixel_count'] += 'pixels'
    # 9) 防护等级：IP66 / IP67
    take(r'\bIP\s?\d{2}\b', 'ip_rating')
    # 10) 光束角：15°*30° / 24° / 120° / 15*30deg / 10x45deg / 30deg（° 后不能加 \b：° 非词字符）
    take(r'\b\d+(?:\.\d+)?\s*[°*×xX/]\s*\d+(?:\.\d+)?\s*(?:°|deg\b)|\b\d+(?:\.\d+)?\s*(?:°|deg\b)(?:\s*beam\s*angle)?',
         'beam_angle')
    if out.get('beam_angle'):
        out['beam_angle'] = re.sub(r'\s*beam\s*angle', '', out['beam_angle'], flags=re.I).strip()
    # 11) 控制协议：DMX512 / DMX / SPI
    take(r'\bDMX512\b|\bDMX\b|\bSPI\b', 'control')
    # 12) 光色：RGBW / RGB（led_count 规则已优先消化带 pcs/SMD 的组合）
    take(r'\bRGBW\b|\bRGB\b', 'cct_color')
    # 13) 色温：3000K / 2700K
    take(r'\b(\d{4})\s*K\b', 'cct', group=1)
    if out.get('cct'):
        out['cct'] += 'K'
    # 14) 灯体颜色：White body / RAL9016 / gray color / 黑色 / 白色
    take(r'\bWhite body\b|\bBlack body\b|\bRAL\s?\d{4}\b|\b(?:gray|grey|silver|black|white)\s+color\b',
         'body_color')
    take(r'\b黑色\b|\b白色\b|\b灰色\b', 'body_color', flags=0)
    # 15) 品牌：Chenglian brand / 明纬 brand
    m = re.search(r'([A-Za-z\u4e00-\u9fa5]+)\s*brand\s*[,，]?', rest, re.I)
    if m:
        out['driver_brand'] = m.group(1).strip()
        rest = rest[:m.start()] + ' ' + rest[m.end():]
    # 16) IK 防冲击等级：IK10
    take(r'\bIK\s?\d{2}\b', 'ik_rating')
    # 17) 安全认证：CE / RoHS / UL / ETL / CCC / SAA / PSE / FCC / UKCA（多值 join "/"）
    take(r'\b(?:CE|RoHS|ROHS|rohs|UL|cUL|ETL|CCC|SAA|PSE|FCC|UKCA)\b', 'certifications')
    # 18) 显色指数：Ra≥80 / Ra80 / CRI90
    take(r'\b(?:Ra|CRI)\s?[≥>≧]?\s?\d{2}\b', 'cri', flags=re.I)
    # 19) 功率因数：PF≥0.9 / PF0.95 / 功率因数≥0.95
    take(r'\b(?:PF|功率因数)\s*[≥>≧]?\s?\d\.\d{1,2}\b', 'power_factor')
    # 20) 光效（先于光通量，避免 lm/W 被吞）：≥135lm/W
    take(r'[≥>≧]?\s?\b\d{2,4}(?:\.\d+)?\s?lm\s?/\s?W\b', 'efficacy')
    # 21) 光通量：400-500lm / 800lm
    take(r'[≥>≧]?\s?\b\d{3,5}(?:\s?-\s?\d{3,5})?\s?lm\b', 'luminous_flux')
    # 22) 浪涌保护：≥10KV / 10kV
    take(r'[≥>≧]?\s?\b\d{1,3}(?:\.\d+)?\s?[kK][vV]\b', 'surge_protection')
    # 23) 灰度等级：8bit / 16 bit
    take(r'\b\d{1,2}\s?bit\b', 'grayscale', flags=re.I)
    # 24) 电源频率：50/60Hz / 60Hz
    take(r'\b\d{2}(?:\s?/\s?\d{2})?\s?Hz\b', 'frequency', flags=re.I)
    # 25) 输入电流：240mA / 0.35A
    take(r'\b\d+(?:\.\d+)?\s?mA\b', 'input_current')
    take(r'\b\d\.\d{1,2}\s?A\b', 'input_current')
    # 26) 波长：R:619-624nm / 465-475nm / 465nm
    take(r'\b(?:[RGBrgb]\s?:\s?)?\d{3}\s?-\s?\d{3}\s?nm\b|\b\d{3}\s?nm\b', 'wavelength', flags=re.I)
    # 27) 安装方式：壁挂 / 嵌入式 / recessed / in-ground
    take(r'\b(?:壁挂式?|吸顶式?|地埋式?|嵌入式|支架式?|明装)\b', 'install_type')
    take(r'\b(?:recessed|surface\s?mounted|wall\s?mounted|in-?ground|buried|pendant)\b', 'install_type', flags=re.I)
    # 28) 光通量维持率：L70≥50,000h（先于寿命，避免被吞）
    take(r'\bL[789]\d\s?[≥>≧]?\s?[\d,]{3,7}\s?[hH]\b', 'l70')
    # 29) 额定寿命：≥30,000h / 50000h
    take(r'[≥>≧]?\s?\b[\d,]{4,7}\s?[hH]\b', 'lifespan')
    # 30) 芯片/品牌：Osram / Cree / Lumileds / Bridgelux / Epistar / 晶元
    take(r'\b(?:Osram|Cree|Lumileds|Bridgelux|Epistar|Sanan|Samsung|Nichia)\b|晶元|科锐', 'brand', flags=re.I)
    # 31) 产品类别：LED洗墙灯 → 洗墙灯
    take(r'(?:LED\s*)?(?:洗墙灯|线条灯|投光灯|点光源|轮廓灯|地埋灯|草坪灯|投射灯|灯带|控制器|电源)', 'category')

    # 剩余文本 → ext1（全部未匹配文本，不分割）；ext2/ext3 留给用户手动填写
    rest = _clean_rest(rest)
    if rest:
        out['ext1'] = rest
    return out


def parse_description_safe(desc):
    try:
        return parse_description(desc)
    except Exception:
        return {'notes': desc or ''}


# ---------------------------------------------------------------------------
# 字段 → 描述（真实 PI 风格）
# ---------------------------------------------------------------------------
def _fmt_cct_color(f):
    """RGBW(3000K) 组合：cct_color 与 cct 同时有值时合并。"""
    cc = (f.get('cct_color') or '').strip()
    cct = (f.get('cct') or '').strip()
    if cc and cct:
        if cct.lower() in cc.lower():
            return cc
        return '%s(%s)' % (cc, cct)
    return cc or cct


def build_description(f, for_pi=True, extra_notes=''):
    """按核心字段生成描述。for_pi=True 时末行带 hs code。
    f: dict（核心字段名 → 值）。notes 原样保留。"""
    g = lambda k: str(f.get(k) or '').strip()
    line1 = [g('model'), g('length_size'), g('voltage'), g('power'), g('led_count'), g('led_chip'),
             _fmt_cct_color(f), g('control'), g('ip_rating')]
    line2 = [g('pixel_count'), g('beam_angle'), g('material'), g('body_color'), g('driver_brand')]
    ext_vals = [g('ext1'), g('ext2'), g('ext3')]
    lines = [', '.join([x for x in line1 if x])]
    l2_parts = [x for x in line2 if x] + [x for x in ext_vals if x]
    l2 = ', '.join(l2_parts)
    if l2:
        lines.append(l2)
    notes = '\n'.join([x for x in [g('notes'), extra_notes] if x])
    if notes:
        lines.append(notes)
    if for_pi and g('hs_code'):
        lines.append('hs code, %s' % g('hs_code'))
    return '\n'.join([x for x in lines if x.strip()]).strip()


def merge_spec(row, spec_json_str):
    """行 + spec_json 合并成完整字段 dict（供生成描述/导出）。"""
    import json
    d = {}
    if spec_json_str:
        try:
            d.update(json.loads(spec_json_str))
        except Exception:
            pass
    for k in CORE_KEYS + ['ext1', 'ext2', 'ext3']:
        v = row.get(k)
        if v is not None and str(v).strip() != '':
            d[k] = v
    return d
