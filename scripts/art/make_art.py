"""Генератор иллюстраций бара в живописном стиле (SVG -> WebP через Chromium).
Запуск: python3 scripts/art/make_art.py  (нужен playwright + chromium)
"""
import os, pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / 'public' / 'assets' / 'bar'
SRC = pathlib.Path(__file__).resolve().parent / 'svg'
SRC.mkdir(exist_ok=True)

W, H = 600, 800

DEFS = '''
<defs>
  <filter id="paint" x="-15%" y="-15%" width="130%" height="130%">
    <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="3" result="grain"/>
    <feColorMatrix in="grain" type="saturate" values="0" result="gg"/>
    <feComponentTransfer in="gg" result="g2"><feFuncA type="linear" slope="0" intercept="0.22"/></feComponentTransfer>
    <feComposite in="g2" in2="d" operator="in" result="g3"/>
    <feBlend in="g3" in2="d" mode="overlay"/>
  </filter>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>
  <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
  <linearGradient id="glass" x1="0" x2="1">
    <stop offset="0" stop-color="#6d7c86" stop-opacity=".55"/>
    <stop offset=".22" stop-color="#c9d4d6" stop-opacity=".35"/>
    <stop offset=".5" stop-color="#8b9aa2" stop-opacity=".18"/>
    <stop offset=".82" stop-color="#5b6a74" stop-opacity=".35"/>
    <stop offset="1" stop-color="#3a444c" stop-opacity=".6"/>
  </linearGradient>
  <linearGradient id="amber" x1="0" x2="1">
    <stop offset="0" stop-color="#5a2a10"/><stop offset=".35" stop-color="#b86a24"/>
    <stop offset=".6" stop-color="#d9913a"/><stop offset="1" stop-color="#6b3212"/>
  </linearGradient>
  <linearGradient id="paleGold" x1="0" x2="1">
    <stop offset="0" stop-color="#b8a46a" stop-opacity=".75"/><stop offset=".4" stop-color="#efe3b0" stop-opacity=".7"/>
    <stop offset="1" stop-color="#8e7c48" stop-opacity=".8"/>
  </linearGradient>
  <linearGradient id="paper" x1="0" x2="1">
    <stop offset="0" stop-color="#b9b39a"/><stop offset=".35" stop-color="#e4decb"/>
    <stop offset=".7" stop-color="#d3cdb6"/><stop offset="1" stop-color="#9e987f"/>
  </linearGradient>
  <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#b9cdb0"/><stop offset=".5" stop-color="#7f9e7a"/><stop offset="1" stop-color="#3f5d48"/>
  </linearGradient>
  <linearGradient id="leafDark" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8fa98a"/><stop offset="1" stop-color="#2f4a3a"/>
  </linearGradient>
  <radialGradient id="grapeW" cx=".35" cy=".3" r=".75">
    <stop offset="0" stop-color="#f3ecb8"/><stop offset=".45" stop-color="#c9c27a"/><stop offset="1" stop-color="#6f7a3c"/>
  </radialGradient>
  <radialGradient id="walnut" cx=".4" cy=".35" r=".8">
    <stop offset="0" stop-color="#c49a6a"/><stop offset=".6" stop-color="#8a6038"/><stop offset="1" stop-color="#4c3018"/>
  </radialGradient>
  <linearGradient id="clay" x1="0" x2="1">
    <stop offset="0" stop-color="#6b3a26"/><stop offset=".35" stop-color="#b56f47"/><stop offset=".65" stop-color="#a55f3a"/><stop offset="1" stop-color="#4f2718"/>
  </linearGradient>
  <linearGradient id="foam" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fbf6e8"/><stop offset="1" stop-color="#d9cfb4"/>
  </linearGradient>
  <linearGradient id="beer" x1="0" x2="1">
    <stop offset="0" stop-color="#8a5418"/><stop offset=".4" stop-color="#e3a53a"/><stop offset=".7" stop-color="#f0c060"/><stop offset="1" stop-color="#94591a"/>
  </linearGradient>
  <linearGradient id="rose" x1="0" x2="1">
    <stop offset="0" stop-color="#7a1f2e"/><stop offset=".45" stop-color="#d0566a"/><stop offset=".7" stop-color="#e98a8f"/><stop offset="1" stop-color="#7d2233"/>
  </linearGradient>
  <linearGradient id="tarragon" x1="0" x2="1">
    <stop offset="0" stop-color="#2f6a3c"/><stop offset=".4" stop-color="#6cc07a"/><stop offset=".65" stop-color="#95d892"/><stop offset="1" stop-color="#2d6337"/>
  </linearGradient>
  <linearGradient id="bottleGreen" x1="0" x2="1">
    <stop offset="0" stop-color="#1f3a2c" stop-opacity=".85"/><stop offset=".3" stop-color="#5f8a70" stop-opacity=".55"/>
    <stop offset=".55" stop-color="#3b6150" stop-opacity=".45"/><stop offset="1" stop-color="#16271e" stop-opacity=".9"/>
  </linearGradient>
  <linearGradient id="frost" x1="0" x2="1">
    <stop offset="0" stop-color="#8697a0"/><stop offset=".3" stop-color="#e2e8e6"/><stop offset=".6" stop-color="#c3ced0"/><stop offset="1" stop-color="#6e7f88"/>
  </linearGradient>
  <linearGradient id="cream" x1="0" x2="1">
    <stop offset="0" stop-color="#bdb49c"/><stop offset=".4" stop-color="#efe8d6"/><stop offset=".8" stop-color="#d8cfb9"/><stop offset="1" stop-color="#a39a80"/>
  </linearGradient>
  <linearGradient id="coffee" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#6b3f22"/><stop offset="1" stop-color="#2d170b"/>
  </linearGradient>
  <radialGradient id="citrus" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#fff4c2"/><stop offset=".7" stop-color="#f3cf5a"/><stop offset=".86" stop-color="#e7b23a"/><stop offset="1" stop-color="#b9821d"/>
  </radialGradient>
  <radialGradient id="pear" cx=".4" cy=".35" r=".8">
    <stop offset="0" stop-color="#eef0a0"/><stop offset=".55" stop-color="#b7c257"/><stop offset="1" stop-color="#6c7a2c"/>
  </radialGradient>
  <radialGradient id="hop" cx=".4" cy=".3" r=".9">
    <stop offset="0" stop-color="#d7e7a5"/><stop offset=".6" stop-color="#94b35f"/><stop offset="1" stop-color="#4d6a33"/>
  </radialGradient>
  <radialGradient id="shadow" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#140c0c" stop-opacity=".55"/><stop offset="1" stop-color="#140c0c" stop-opacity="0"/>
  </radialGradient>
</defs>
'''

def leaf(x, y, s=1.0, rot=0, grad='leaf'):
    """Живописный лист (как на референсе с веточкой)."""
    return f'''<g transform="translate({x} {y}) rotate({rot}) scale({s})">
      <path d="M0 0 C 30 -30, 70 -40, 95 -10 C 70 10, 30 20, 0 0 Z" fill="url(#{grad})"/>
      <path d="M0 0 C 30 -30, 70 -40, 95 -10" fill="none" stroke="#dfe8d4" stroke-width="2" opacity=".55"/>
      <path d="M4 -1 Q 50 -12 92 -10" fill="none" stroke="#e9efe0" stroke-width="1.6" opacity=".7"/>
    </g>'''

def sprig(x, y, s=1.0, rot=0):
    parts = [
        leaf(0, 0, 1.0, -70, 'leaf'), leaf(0, 0, .9, -30, 'leafDark'), leaf(0, 0, .95, -110, 'leafDark'),
        leaf(0, 0, .8, 5, 'leaf'), leaf(0, 0, .75, -150, 'leaf'),
    ]
    return f'<g transform="translate({x} {y}) rotate({rot}) scale({s})">' + ''.join(parts) + \
           '<path d="M0 0 Q -6 30 -2 60" stroke="#6e8a66" stroke-width="4" fill="none"/></g>'

def shadow(cx, cy, rx, ry):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#shadow)"/>'

def grape(cx, cy, r, grad='grapeW'):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#{grad})"/>'
            f'<ellipse cx="{cx - r*.35}" cy="{cy - r*.38}" rx="{r*.28}" ry="{r*.18}" fill="#fffbe6" opacity=".7"/>')

def bunch(x, y, s=1.0, grad='grapeW'):
    pts = [(0,0),(22,4),(44,0),(-8,22),(14,26),(36,24),(56,20),(4,48),(26,50),(46,44),(14,72),(34,70),(24,94)]
    g = ''.join(grape(px, py, 15, grad) for px, py in pts)
    return f'<g transform="translate({x} {y}) scale({s})"><path d="M22 -30 Q 26 -12 22 0" stroke="#7f8a4a" stroke-width="4" fill="none"/>{g}</g>'

def highlight(d, op=.55, w=6):
    return f'<path d="{d}" stroke="#ffffff" stroke-opacity="{op}" stroke-width="{w}" fill="none" stroke-linecap="round"/>'

def svg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{DEFS}<g filter="url(#paint)">{body}</g></svg>'

ART = {}

# ── ЧАЧА: графин + рюмка + белый виноград ──
ART['chacha'] = svg(
    shadow(300, 700, 230, 34) +
    # графин
    '<path d="M258 150 h84 v70 C 342 250, 430 300, 430 450 C 430 610, 380 690, 300 690 C 220 690, 170 610, 170 450 C 170 300, 258 250, 258 220 Z" fill="url(#glass)" stroke="#dfe6e6" stroke-opacity=".35" stroke-width="3"/>'
    '<path d="M186 470 C 190 600, 230 676, 300 676 C 370 676, 410 600, 414 470 Z" fill="url(#paleGold)"/>'
    '<ellipse cx="300" cy="470" rx="114" ry="16" fill="#f6edc6" opacity=".55"/>'
    '<rect x="250" y="126" width="100" height="30" rx="10" fill="#8c3c3c"/><rect x="250" y="126" width="100" height="10" rx="5" fill="#b86060" opacity=".7"/>'
    + highlight('M212 380 C 196 450, 198 560, 232 630', .5, 9) + highlight('M280 170 L 280 230', .45, 5) +
    # рюмка
    '<path d="M420 560 h70 l-8 118 h-54 Z" fill="url(#glass)" stroke="#e6ecec" stroke-opacity=".4" stroke-width="2"/>'
    '<path d="M424 600 h62 l-6 74 h-50 Z" fill="url(#paleGold)"/>'
    + highlight('M432 575 L 436 660', .55, 4) +
    bunch(90, 540, 1.05) + sprig(150, 520, .9, 200)
)

# ── КОНЬЯК: бокал-снифтер + грецкие орехи ──
ART['brandy'] = svg(
    shadow(300, 705, 220, 30) +
    '<path d="M300 610 L 300 690" stroke="#cfd8da" stroke-opacity=".6" stroke-width="12"/>'
    '<ellipse cx="300" cy="694" rx="92" ry="16" fill="url(#glass)" stroke="#e6ecec" stroke-opacity=".35"/>'
    '<path d="M190 250 C 150 360, 160 560, 300 612 C 440 560, 450 360, 410 250 Z" fill="url(#glass)" stroke="#e6ecec" stroke-opacity=".35" stroke-width="3"/>'
    '<path d="M162 440 C 170 540, 220 600, 300 604 C 380 600, 430 540, 438 440 Z" fill="url(#amber)" opacity=".92"/>'
    '<ellipse cx="300" cy="442" rx="138" ry="20" fill="#f0b35a" opacity=".55"/>'
    + highlight('M196 300 C 176 380, 182 480, 214 540', .5, 9) + highlight('M392 290 C 404 330, 410 380, 404 420', .3, 5) +
    ''.join(f'<g transform="translate({x} {y}) rotate({r})"><ellipse rx="44" ry="38" fill="url(#walnut)"/><path d="M-40 0 Q 0 -8 40 0" stroke="#3e2512" stroke-width="3" fill="none"/><path d="M-26 -22 q10 12 0 22 M 8 -30 q-8 14 4 26 M 22 8 q -10 10 2 22" stroke="#5a3a1e" stroke-width="2.5" fill="none" opacity=".8"/></g>'
            for x, y, r in [(110, 650, -15), (470, 660, 20), (520, 600, -30)]) +
    sprig(96, 560, .8, 190)
)

# ── ВОДКА: матовая бутылка в бумаге + стопка + колос ──
ART['vodka'] = svg(
    shadow(300, 712, 210, 30) +
    '<path d="M266 110 h68 v130 C 334 270, 380 290, 380 340 L 380 690 Q 380 706, 364 706 L 236 706 Q 220 706, 220 690 L 220 340 C 220 290, 266 270, 266 240 Z" fill="url(#frost)"/>'
    '<rect x="262" y="86" width="76" height="40" rx="8" fill="#a5b2b8"/><rect x="262" y="86" width="76" height="12" rx="6" fill="#dfe6e8"/>'
    # бумажная обёртка
    '<path d="M212 420 L 388 400 L 392 612 L 208 630 Z" fill="url(#paper)"/>'
    '<path d="M212 420 L 388 400 L 360 452 L 232 468 Z" fill="#f1ecdc" opacity=".55"/>'
    '<path d="M210 560 C 260 546, 330 540, 392 548" stroke="#a88d95" stroke-width="5" fill="none"/>'
    '<circle cx="300" cy="520" r="46" fill="#f4efe2" opacity=".85"/><circle cx="300" cy="520" r="46" fill="none" stroke="#b5a98c" stroke-width="2"/>'
    + highlight('M244 300 L 244 400', .6, 10) + highlight('M244 640 L 244 690', .45, 8) +
    '<path d="M430 590 h76 l-8 110 h-60 Z" fill="url(#glass)" stroke="#eef2f2" stroke-opacity=".45" stroke-width="2"/>'
    '<path d="M434 612 h68 l-6 84 h-56 Z" fill="#e8eeee" opacity=".35"/>'
    + highlight('M444 604 L 448 684', .6, 4) +
    # колос пшеницы
    '<g transform="translate(120 700) rotate(-18)"><path d="M0 0 Q 4 -170 10 -300" stroke="#b9a15a" stroke-width="5" fill="none"/>' +
    ''.join(f'<ellipse cx="{6 + (i % 2) * 16 - 8}" cy="{-190 - i * 16}" rx="10" ry="18" transform="rotate({(-25 if i % 2 else 25)} {6 + (i % 2) * 16 - 8} {-190 - i * 16})" fill="#d8c27a"/>' for i in range(7)) +
    '</g>'
)

# ── ВИСКИ: тумблер + лёд + апельсиновая цедра ──
ART['spirits'] = svg(
    shadow(300, 690, 230, 32) +
    '<path d="M170 380 L 186 670 Q 188 690, 210 690 L 390 690 Q 412 690, 414 670 L 430 380 Z" fill="url(#glass)" stroke="#e8eded" stroke-opacity=".4" stroke-width="3"/>'
    '<path d="M180 520 L 188 668 Q 190 680, 208 680 L 392 680 Q 410 680, 412 668 L 420 520 Z" fill="url(#amber)" opacity=".9"/>'
    '<rect x="206" y="450" width="96" height="92" rx="14" fill="#e9f0f0" opacity=".55" transform="rotate(-12 254 496)"/>'
    '<rect x="292" y="468" width="88" height="84" rx="14" fill="#dfe8e8" opacity=".5" transform="rotate(10 336 510)"/>'
    '<ellipse cx="300" cy="522" rx="120" ry="14" fill="#f3b660" opacity=".55"/>'
    + highlight('M196 410 L 206 640', .5, 9) + highlight('M404 420 L 398 520', .3, 5) +
    # цедра
    '<path d="M396 360 C 470 330, 520 380, 500 430 C 490 460, 450 470, 440 440 C 470 430, 480 395, 440 385 Z" fill="#e98a2c"/>'
    '<path d="M404 366 C 460 346, 500 380, 492 420" stroke="#ffd08a" stroke-width="4" fill="none" opacity=".8"/>'
    + sprig(110, 640, .75, 200)
)

# ── ПИВО: керамическая кружка + пена + хмель ──
def hop(x, y, s=1, r=0):
    sc = ''.join(f'<path d="M{-18 + (i % 2) * 18} {-30 + i * 12} q 18 -16 36 0 q -18 16 -36 0 Z" fill="url(#hop)" stroke="#5f7d3e" stroke-width="1.5"/>' for i in range(5))
    return f'<g transform="translate({x} {y}) rotate({r}) scale({s})">{sc}</g>'

ART['beer'] = svg(
    shadow(300, 712, 230, 32) +
    '<path d="M400 360 C 490 360, 500 560, 400 580" stroke="url(#clay)" stroke-width="34" fill="none" stroke-linecap="round"/>'
    '<path d="M180 300 L 190 680 Q 192 704, 220 704 L 380 704 Q 408 704, 410 680 L 420 300 Z" fill="url(#clay)"/>'
    '<path d="M186 420 L 414 420 L 412 460 L 188 460 Z" fill="#e7d8b8" opacity=".85"/>'
    + ''.join(f'<path d="M{200 + i * 36} 440 l12 -12 l12 12 l-12 12 Z" fill="#6b3a26"/>' for i in range(6)) +
    '<path d="M168 300 C 160 250, 210 230, 236 246 C 250 210, 320 212, 334 244 C 362 222, 430 236, 426 290 C 440 312, 420 330, 400 322 L 196 322 C 172 328, 160 314, 168 300 Z" fill="url(#foam)"/>'
    '<path d="M196 322 C 200 350, 216 352, 222 330 M 300 322 C 304 360, 322 360, 326 330" fill="#f5efdd"/>'
    + highlight('M210 480 L 214 660', .35, 10) +
    hop(110, 610, 1.3, -20) + hop(500, 650, 1.1, 25) + leaf(140, 560, 1.1, -150, 'leafDark') + leaf(470, 610, 1, -40, 'leaf')
)

# ── КОКТЕЙЛИ: бокал-купе + цитрус + мята ──
ART['cocktails'] = svg(
    shadow(300, 712, 200, 28) +
    '<path d="M300 470 L 300 690" stroke="#d3dcde" stroke-opacity=".65" stroke-width="10"/>'
    '<ellipse cx="300" cy="696" rx="96" ry="16" fill="url(#glass)" stroke="#eef2f2" stroke-opacity=".35"/>'
    '<path d="M130 330 C 140 430, 220 480, 300 480 C 380 480, 460 430, 470 330 Z" fill="url(#glass)" stroke="#eef2f2" stroke-opacity=".4" stroke-width="3"/>'
    '<path d="M144 348 C 156 430, 226 468, 300 468 C 374 468, 444 430, 456 348 Z" fill="url(#rose)" opacity=".95"/>'
    '<ellipse cx="300" cy="348" rx="156" ry="16" fill="#f3a3a6" opacity=".6"/>'
    + highlight('M160 360 C 176 410, 210 440, 250 456', .45, 7) +
    # долька цитруса на краю
    '<g transform="translate(430 322) rotate(-20)"><circle r="62" fill="url(#citrus)"/><circle r="50" fill="none" stroke="#fff3c8" stroke-width="3" opacity=".8"/>' +
    ''.join(f'<path d="M0 0 L {50 * __import__("math").cos(a * 0.7854):.1f} {50 * __import__("math").sin(a * 0.7854):.1f}" stroke="#fff6d6" stroke-width="3" opacity=".8"/>' for a in range(8)) +
    '<rect x="-64" y="-4" width="20" height="8" fill="#e9a34a"/></g>' +
    sprig(210, 330, .8, 150) + sprig(120, 640, .8, 210)
)

# ── КОФЕ: чашка с блюдцем + зёрна + пар ──
ART['coffee'] = svg(
    shadow(300, 690, 240, 30) +
    '<ellipse cx="300" cy="640" rx="200" ry="44" fill="url(#cream)"/>'
    '<ellipse cx="300" cy="630" rx="150" ry="28" fill="#cfc6ae" opacity=".8"/>'
    '<path d="M430 450 C 520 440, 520 560, 420 560" stroke="url(#cream)" stroke-width="26" fill="none"/>'
    '<path d="M170 420 C 170 560, 220 632, 300 632 C 380 632, 430 560, 430 420 Z" fill="url(#cream)"/>'
    '<ellipse cx="300" cy="420" rx="130" ry="30" fill="#efe8d6"/>'
    '<ellipse cx="300" cy="424" rx="112" ry="22" fill="url(#coffee)"/>'
    '<ellipse cx="282" cy="418" rx="44" ry="7" fill="#b98352" opacity=".6"/>'
    '<path d="M176 470 C 200 470, 400 470, 424 470" stroke="#8c3c3c" stroke-width="6" opacity=".7"/>'
    '<path d="M180 486 C 200 486, 400 486, 420 486" stroke="#6f8f6a" stroke-width="3" opacity=".6"/>'
    + highlight('M196 450 C 196 520, 214 580, 246 610', .5, 8) +
    ''.join(f'<path d="M{x} 380 C {x - 26} 330, {x + 26} 290, {x} 230" stroke="#efe6d4" stroke-width="10" fill="none" opacity=".35" filter="url(#blur2)"/>' for x in (262, 304, 346)) +
    ''.join(f'<g transform="translate({x} {y}) rotate({r})"><ellipse rx="20" ry="14" fill="#5a331a"/><path d="M-16 0 Q 0 6 16 0" stroke="#2a150a" stroke-width="3" fill="none"/><ellipse cx="-6" cy="-6" rx="7" ry="3" fill="#a06b44" opacity=".7"/></g>'
            for x, y, r in [(120, 690, 20), (160, 720, -30), (470, 700, 10), (505, 730, 60), (440, 735, -20), (95, 735, 70)])
)

# ── ЛИМОНАДЫ: бутылка тархуна + груша + лимон ──
ART['soft'] = svg(
    shadow(300, 714, 230, 30) +
    '<path d="M272 110 h56 v120 C 328 262, 372 280, 372 330 L 372 690 Q 372 708, 354 708 L 246 708 Q 228 708, 228 690 L 228 330 C 228 280, 272 262, 272 230 Z" fill="url(#bottleGreen)"/>'
    '<path d="M234 380 L 366 380 L 366 690 Q 366 700, 352 700 L 248 700 Q 234 700, 234 690 Z" fill="url(#tarragon)" opacity=".85"/>'
    '<rect x="266" y="92" width="68" height="30" rx="6" fill="#c9a23a"/><rect x="266" y="92" width="68" height="9" rx="4" fill="#f1d27a"/>'
    '<path d="M228 460 L 372 460 L 372 590 L 228 590 Z" fill="url(#paper)"/>'
    '<path d="M246 486 h108 M246 506 h108" stroke="#8c3c3c" stroke-width="4"/>'
    '<ellipse cx="300" cy="548" rx="34" ry="22" fill="#6f8f6a" opacity=".85"/>'
    + highlight('M248 300 L 248 440', .55, 9) + highlight('M248 610 L 248 680', .4, 7) +
    # груша
    '<g transform="translate(450 610) rotate(12)"><path d="M0 -90 C 30 -90, 30 -40, 44 -10 C 66 36, 50 90, 0 90 C -50 90, -66 36, -44 -10 C -30 -40, -30 -90, 0 -90 Z" fill="url(#pear)"/>'
    '<path d="M0 -90 q 6 -20 14 -30" stroke="#6b4a2a" stroke-width="5" fill="none"/>' + leaf(8, -108, .7, -40, 'leaf') + '</g>'
    # лимон
    '<g transform="translate(140 660)"><ellipse rx="70" ry="50" fill="#e8c24a"/><ellipse cx="-20" cy="-18" rx="26" ry="12" fill="#fff0a8" opacity=".7"/>'
    '<ellipse cx="72" cy="0" rx="10" ry="8" fill="#d9ad2e"/></g>' +
    sprig(150, 560, .85, 200)
)


def main():
    import asyncio
    from playwright.async_api import async_playwright
    from PIL import Image
    import io

    async def run():
        async with async_playwright() as p:
            b = await p.chromium.launch()
            pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
            for name, s in ART.items():
                (SRC / f'{name}.svg').write_text(s)
                await pg.set_content(f'<html><body style="margin:0;background:transparent">{s}</body></html>')
                png = await pg.screenshot(omit_background=True, clip={'x': 0, 'y': 0, 'width': W, 'height': H})
                im = Image.open(io.BytesIO(png)).convert('RGBA')
                im.save(OUT / f'{name}.webp', 'WEBP', quality=80, method=6)
                print(name, (OUT / f'{name}.webp').stat().st_size)
            await b.close()
    asyncio.run(run())


if __name__ == '__main__':
    main()
