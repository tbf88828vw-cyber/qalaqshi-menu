"""Пост-обработка: пятнистая «акварельная» фактура + постеризация как на референсах."""
import cv2, numpy as np, sys, pathlib
from PIL import Image
D = pathlib.Path(__file__).resolve().parents[2] / 'public' / 'assets' / 'bar'
rng = np.random.default_rng(11)
def mottle(h, w, scale, amp):
    n = rng.standard_normal((h // scale + 2, w // scale + 2)).astype(np.float32)
    n = cv2.resize(n, (w, h), interpolation=cv2.INTER_CUBIC)
    n = cv2.GaussianBlur(n, (0, 0), scale / 2)
    n = n / (np.abs(n).max() + 1e-6)
    return n * amp
for name in sys.argv[1:]:
    p = D / f'{name}.webp'
    im = np.array(Image.open(p).convert('RGBA')).astype(np.float32)
    rgb, a = im[..., :3], im[..., 3:4]
    h, w = a.shape[:2]
    m = mottle(h, w, 18, 0.10) + mottle(h, w, 6, 0.05)
    rgb = np.clip(rgb * (1 + m[..., None]), 0, 255).astype(np.uint8)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    bgr = cv2.pyrMeanShiftFiltering(bgr, 7, 16)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    out = np.dstack([rgb, a.astype(np.uint8)])
    Image.fromarray(out, 'RGBA').save(p, 'WEBP', quality=80, method=6)
    print(name, p.stat().st_size)
