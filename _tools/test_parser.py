# -*- coding: utf-8 -*-
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.spec_fields import parse_description, build_description

SAMPLES = [
    # ICC PI (正式版, 含 hs code)
    'CM-FP-50, \n50mm, DC24V,3W,6pcs SMD,RGBW, IP66,DMX,200mm \nWhite body, 2 dots with 15cm cable (20cm center to center) \nwith 25cm in/out connection, \neach 2 dots in a set \nhs code, 9405429000',
    'CM-FF-F1, \nDC24V, 9W, 3SMD, RGBW,  White body, RAL 9016,  \n15°*30° beam angle, \nhs code, 9405429000',
    'CM-MC-A1, \nDMX main controller \nhs code,8537109090',
    'CM-SC- \nDMX sub controller x8 ports \nhs code, 8537109090',
    '5m length lead cable   \nhs code, 8536690000',
    'DC24V,IP67 \nhs code,8504401400',
    # Ahmad PI (线条灯)
    'L1000*W37*H44mm,DC12V, \n12W, RGBW,DMX, IP67 \n60SMD, 20pixels \nRAL9016 \nsquare diffuser',
    'L1000*W37*H44mm,DC24V, \n12W,RGBW(3000K),DMX, IP66 \n48SMD, 8pixels \nRAL9016, \nwith standard bracket \ncurved diffuser',
    'Chenglian brand, \n240W,DC12V,IP67',
    '9 programs for choice, \nadjust brightness and speed,  \n3 playing mode,  \nON/OFF control',
    'DC48V 10A to DC24V 20A',
    # Rami PI (点光源)
    'RD-FP-50A,DC24V,3W, 6pcs RGBW(2700K) 5050SMD,IP67,DMX512, 60lumens/pcs',
    'ELG-300-24,IP67',
]

for s in SAMPLES:
    f = parse_description(s)
    print('=' * 80)
    print('IN :', s.replace('\n', ' | ')[:100])
    print('OUT:', {k: v for k, v in f.items() if v})
    rebuilt = build_description(f, for_pi=bool(f.get('hs_code')))
    print('GEN:', rebuilt.replace('\n', ' | ')[:120])
