import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

SRC = os.path.abspath('public/avatar/bot.png')
OUT_DIR = os.path.abspath('public/avatar')

img = Image.open(SRC).convert('RGBA')
W, H = img.size
arr = np.array(img)

vest_blue = (18, 28, 62, 255)

# =========================================================================
# 1. BRAZO DERECHO (Incluye hombro, manga, antebrazo, reloj COMPLETO y mano)
# =========================================================================
mask_r = Image.new('L', (W, H), 0)
draw_r = ImageDraw.Draw(mask_r)

# Hombro redondeado para rotación limpia
draw_r.ellipse([540, 410, 640, 500], fill=255)

# Polígono exacto que envuelve todo el brazo y 100% del reloj inteligente
poly_r = [
    (555, 430),
    (752, 430),
    (752, 896),
    (512, 896),   # Cubre completamente por debajo de la mano y reloj
    (512, 755),   # Cubre completamente el borde interior del reloj (x=519..700)
    (540, 690),   # Borde hacia el hueco interior del codo
    (565, 595),   # Borde interior de la manga
    (560, 480)
]
draw_r.polygon(poly_r, fill=255)
mask_r_blur = mask_r.filter(ImageFilter.GaussianBlur(1.2))

arm_r = Image.new('RGBA', (W, H), (0, 0, 0, 0))
arm_r.paste(img, (0, 0), mask=mask_r_blur)

# =========================================================================
# 2. BRAZO IZQUIERDO (Manga, codo y mano izquierda completa)
# =========================================================================
mask_l = Image.new('L', (W, H), 0)
draw_l = ImageDraw.Draw(mask_l)

draw_l.ellipse([80, 410, 165, 500], fill=255)
poly_l = [
    (0, 430),
    (155, 430),
    (155, 520),
    (170, 680),
    (170, 896),
    (0, 896)
]
draw_l.polygon(poly_l, fill=255)
mask_l_blur = mask_l.filter(ImageFilter.GaussianBlur(1.2))

arm_l = Image.new('RGBA', (W, H), (0, 0, 0, 0))
arm_l.paste(img, (0, 0), mask=mask_l_blur)

# =========================================================================
# 3. CUERPO BASE (Torso, chaleco continuo detrás de las muñecas, cuello, cabeza)
# =========================================================================
body = img.copy()
body_arr = np.array(body)

# Quitar brazos de la silueta exterior por debajo de los hombros
for y in range(450, H):
    xl = int(105 + (y - 450) * 0.10)
    body_arr[y, :xl] = [0, 0, 0, 0]

# Quitar brazo derecho respetando la silueta del chaleco (x > 512 por debajo de y=755)
for y in range(450, 755):
    xr = int(595 - (y - 450) * 0.12)
    body_arr[y, xr:] = [0, 0, 0, 0]

for y in range(755, H):
    body_arr[y, 515:] = [0, 0, 0, 0]

body_img = Image.fromarray(body_arr)
draw_body = ImageDraw.Draw(body_img)

# Relleno del chaleco continuo detrás de la zona de descanso del reloj y muñeca
draw_body.polygon([(500, 750), (560, 750), (560, 896), (500, 896)], fill=vest_blue)
# Relleno detrás de la mano izquierda
draw_body.polygon([(110, 750), (160, 750), (160, 896), (110, 896)], fill=vest_blue)

# Zócalos de hombro en chaleco
draw_body.ellipse([85, 420, 160, 495], fill=vest_blue)
draw_body.ellipse([555, 420, 635, 495], fill=vest_blue)

# Reponer el centro intacto para que botones, logo y corbata queden 100% nítidos
body_img.paste(img.crop((165, 0, 505, H)), (165, 0))

# Guardar capas finales
body_img.save(os.path.join(OUT_DIR, 'bot_body.png'), 'PNG')
arm_l.save(os.path.join(OUT_DIR, 'bot_arm_l.png'), 'PNG')
arm_r.save(os.path.join(OUT_DIR, 'bot_arm_r.png'), 'PNG')

print('PERFECT_OPTION2_LAYERS_SAVED')
