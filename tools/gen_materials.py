"""Veta Noble · generador de materiales para la web de Don Morell.

Produce texturas *sin costuras* (tileables) con ruido de Perlin periódico:
  - marble-light.webp  · mármol marfil con vetas grises y champán
  - marble-dark.webp   · mármol Nero Marquina con vetas marfil y oro
  - floor-checker.webp · damero de mármol marfil y Nero Marquina
  - leather-light.webp / leather-dark.webp · capitoné (cuero acolchado)
  - grain.png          · grano de piedra neutro (blanco y negro con alfa)
Uso: python3 tools/gen_materials.py assets/img   (requiere numpy y Pillow)
"""
import sys, os
import numpy as np
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(OUT, exist_ok=True)


def fade(t):
    return t * t * t * (t * (t * 6 - 15) + 10)


class Perlin:
    """Ruido de gradiente periódico: período px × py celdas."""
    def __init__(self, px, py, seed):
        rng = np.random.default_rng(seed)
        a = rng.uniform(0, 2 * np.pi, (py, px))
        self.gx, self.gy, self.px, self.py = np.cos(a), np.sin(a), px, py

    def __call__(self, u, v):
        x0 = np.floor(u).astype(np.int64); y0 = np.floor(v).astype(np.int64)
        fx = u - x0; fy = v - y0
        x0 %= self.px; y0 %= self.py
        x1 = (x0 + 1) % self.px; y1 = (y0 + 1) % self.py
        gx, gy = self.gx, self.gy
        n00 = gx[y0, x0] * fx + gy[y0, x0] * fy
        n10 = gx[y0, x1] * (fx - 1) + gy[y0, x1] * fy
        n01 = gx[y1, x0] * fx + gy[y1, x0] * (fy - 1)
        n11 = gx[y1, x1] * (fx - 1) + gy[y1, x1] * (fy - 1)
        uu = fade(fx); vv = fade(fy)
        return (n00 * (1 - uu) + n10 * uu) * (1 - vv) + (n01 * (1 - uu) + n11 * uu) * vv


def fbm(X, Y, N, base, octaves, seed, aniso=(1, 1), gain=0.5):
    total = np.zeros_like(X); amp = 1.0; norm = 0.0
    for i in range(octaves):
        px = int(base * aniso[0] * 2 ** i); py = int(base * aniso[1] * 2 ** i)
        total += amp * Perlin(px, py, seed + i * 101)(X * px / N, Y * py / N)
        norm += amp; amp *= gain
    return total / norm * 1.6   # ≈ [-1, 1]


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float64)


def lerp(a, b, t):
    return a + (b - a) * t[..., None]


def marble_fields(N, seed):
    """Vetas fluidas en diagonal con ramas que nacen de ellas (estilo Calacatta / Nero Marquina)."""
    y, x = np.mgrid[0:N, 0:N].astype(np.float64)
    # Torsión amplia y lenta: la piedra fluye
    w1 = fbm(x, y, N, 1, 5, seed + 1); w2 = fbm(x, y, N, 1, 5, seed + 2)
    xw = x + 0.16 * N * w1; yw = y + 0.16 * N * w2
    t1 = fbm(xw, yw, N, 2, 6, seed + 3)
    t2 = fbm(xw, yw, N, 3, 6, seed + 13)
    # Vetas primarias (período entero en x e y → sin costuras)
    s1 = np.sin(2 * np.pi * (x + y) / N + 3.6 * t1)
    w = 0.018 + 0.05 * smooth(-0.3, 0.9, fbm(xw, yw, N, 2, 3, seed + 4)) ** 2
    pres1 = smooth(-0.55, 0.15, fbm(xw, yw, N, 1, 4, seed + 5))
    core1 = np.exp(-(s1 / w) ** 2) * pres1
    halo1 = np.exp(-(s1 / (w * 7 + 0.05)) ** 2) * pres1
    # Vetas secundarias que cruzan en otro ángulo, más finas y discontinuas
    s2 = np.sin(2 * np.pi * (2 * x - y) / N + 4.4 * t2)
    pres2 = smooth(0.05, 0.55, fbm(xw, yw, N, 2, 4, seed + 6))
    core2 = np.exp(-(s2 / 0.012) ** 2) * pres2
    # Ramas y capilares: solo cerca de las vetas grandes
    r = 1 - np.abs(fbm(xw, yw, N, 4, 6, seed + 7))
    near = np.clip(halo1 * 1.4 + core2 * 0.6, 0, 1)
    branch = r ** 26 * near
    r2 = 1 - np.abs(fbm(xw, yw, N, 8, 4, seed + 8))
    fine = r2 ** 44 * (0.25 + near * 0.75)
    cloud = smooth(-0.9, 0.9, fbm(x, y, N, 2, 7, seed + 10))
    gold = smooth(0.2, 0.55, fbm(xw, yw, N, 1, 3, seed + 11))
    return dict(core1=core1, halo1=halo1, core2=core2, branch=branch, fine=fine, cloud=cloud, gold=gold)


def dither(img, amt=0.9, seed=5):
    return img + np.random.default_rng(seed).uniform(-amt, amt, img.shape[:2])[..., None]


def marble_light(f):
    img = lerp(hexrgb('#F7F3EC'), hexrgb('#ECE5D8'), f['cloud'] ** 1.2)
    img = lerp(img, hexrgb('#DDD5C7'), np.clip(f['halo1'] * 0.55, 0, 1))
    veins = np.clip(f['core1'] * 0.62 + f['core2'] * 0.34 + f['branch'] * 0.42 + f['fine'] * 0.2, 0, 1)
    img = lerp(img, hexrgb('#978F82'), veins)
    img = lerp(img, hexrgb('#BC9A5E'), np.clip(f['core1'] * f['gold'] * 0.75, 0, 1))
    return dither(img)


def marble_dark(f):
    img = lerp(hexrgb('#09090A'), hexrgb('#17171A'), f['cloud'] ** 1.5)
    img = lerp(img, hexrgb('#24231F'), np.clip(f['halo1'] * 0.5, 0, 1))
    veins = np.clip(f['core1'] * 0.5 + f['core2'] * 0.3 + f['branch'] * 0.36 + f['fine'] * 0.16, 0, 1)
    img = lerp(img, hexrgb('#E6E0D5'), veins)
    img = lerp(img, hexrgb('#C6A367'), np.clip(f['core1'] * f['gold'] * 0.6, 0, 1))
    return dither(img, 1.2)


def save(img, name, q=82):
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    path = os.path.join(OUT, name)
    if name.endswith('.webp'):
        im.save(path, 'WEBP', quality=q, method=6)
    else:
        im.save(path)
    print(f'{name}: {im.size[0]}x{im.size[1]} {os.path.getsize(path) // 1024} KB')
    return im


# ---------- Mármoles (tile 1600 px, se muestra a ~1000 px CSS) ----------
N = 1600
F = marble_fields(N, seed=20261105)
light = marble_light(F); dark = marble_dark(F)
save(light, 'marble-light.webp', 88)
save(dark, 'marble-dark.webp', 93)
for name, img in (('light', light), ('dark', dark)):   # verificación de costura
    seam_x = np.abs(img[:, 0] - img[:, -1]).mean(); seam_y = np.abs(img[0] - img[-1]).mean()
    inner = np.abs(img[:, 0] - img[:, 1]).mean()
    print(f'  costura {name}: x {seam_x:.2f} y {seam_y:.2f} (vecino {inner:.2f})')

# ---------- Damero de mármol (8 × 8 baldosas, sin costuras) ----------
T = 8; tile = N // T
yy, xx = np.mgrid[0:N, 0:N]
checker = ((xx // tile + yy // tile) % 2 == 0)
floor = np.where(checker[..., None], light, dark)
grout = (np.minimum(xx % tile, tile - xx % tile) < 2) | (np.minimum(yy % tile, tile - yy % tile) < 2)
floor = np.where(grout[..., None], hexrgb('#8E877B'), floor)
save(floor[::2, ::2], 'floor-checker.webp', 88)   # 800 px basta: se ve en perspectiva

# ---------- Capitoné (cuero acolchado) con relieve iluminado ----------
S = 360
y, x = np.mgrid[0:S, 0:S].astype(np.float64)
u = 2 * x / S; v = 2 * y / S                     # 2 celdas por tile
p = u + v; q = u - v                             # retícula a 45°: botones en (p, q) enteros
fp = p - np.floor(p) - 0.5; fq = q - np.floor(q) - 0.5
dc = np.maximum(np.abs(fp), np.abs(fq))          # 0 en el centro del cojín, 0.5 en el pliegue
h = np.clip(1 - (dc / 0.5) ** 2, 0, 1) ** 0.55    # altura del cojín
hy, hx = np.gradient(h * 22.0)
nz = 1 / np.sqrt(hx ** 2 + hy ** 2 + 1)
L = np.array([-0.45, -0.6, 0.66]); L = L / np.linalg.norm(L)
lambert = np.clip((-hx * L[0] - hy * L[1] + L[2]) * nz, 0, 1)
spec = lambert ** 18
bp = np.round(p); bq = np.round(q)
db = np.sqrt((p - bp) ** 2 + (q - bq) ** 2)       # distancia al botón más cercano
btn = np.exp(-(db / 0.055) ** 2)
fold = np.exp(-((0.5 - dc) / 0.018) ** 2) * (1 - np.exp(-(db / 0.35) ** 2)) * 0.6 + np.exp(-((0.5 - dc) / 0.05) ** 2) * 0.35
pore = np.random.default_rng(7).normal(0, 1, (S, S))
for name, c0, c1, ink, hi, k in (
        ('light', '#D9CFBE', '#FBF7F0', '#8E8270', '#FFFFFF', 2.0),
        ('dark', '#060606', '#2A2826', '#000000', '#5A5650', 1.6)):
    img = lerp(hexrgb(c0), hexrgb(c1), lambert)
    img = lerp(img, hexrgb(ink), np.clip(fold * 0.8 + btn * 0.95, 0, 1))
    img = lerp(img, hexrgb(hi), np.clip(spec * 0.35 + btn * 0.0, 0, 1))
    img += pore[..., None] * k
    save(img, f'leather-{name}.webp', 84)

# ---------- Grano neutro (aclara y oscurece por igual) ----------
G = 160
rng = np.random.default_rng(3)
g = rng.normal(0, 1, (G, G))
rgba = np.zeros((G, G, 4), dtype=np.uint8)
rgba[..., :3] = np.where(g[..., None] > 0, 255, 0)
rgba[..., 3] = np.clip(np.abs(g) * 22, 0, 70).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT, 'grain.png'), optimize=True)
print('grain.png', os.path.getsize(os.path.join(OUT, 'grain.png')) // 1024, 'KB')
