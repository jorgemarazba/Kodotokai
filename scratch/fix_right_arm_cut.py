import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

SRC = os.path.abspath('public/avatar/bot.png')
OUT_DIR = os.path.abspath('public/avatar')

img = Image.open(SRC).convert('RGBA')
W, H = img.size

# 1. BRAZO IZQUIERDO (Brazo que cuelga libremente y puede gesticular sin tocar la cadera)
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

# 2. CUERPO BASE (Conserva el brazo derecho, reloj, muñeca y chaleco 100% ORIGINALES E INTACTOS)
# De esta manera, el reloj y la muñeca NUNCA se cortan porque son la imagen original continua.
body = img.copy()
body_arr = np.array(body)

# Solo quitamos el brazo izquierdo que es el que se articula por separado
for y in range(450, H):
    xl = int(105 + (y - 450) * 0.10)
    body_arr[y, :xl] = [0, 0, 0, 0]

body_img = Image.fromarray(body_arr)
draw_body = ImageDraw.Draw(body_img)

# Relleno suave detrás del hombro y costado izquierdo
vest_blue = (18, 28, 62, 255)
draw_body.polygon([(110, 750), (160, 750), (160, 896), (110, 896)], fill=vest_blue)
draw_body.ellipse([85, 420, 160, 495], fill=vest_blue)

# Reponer centro para que los detalles no sufran ningún filtro
body_img.paste(img.crop((165, 0, W, H)), (165, 0))

# Guardar
body_img.save(os.path.join(OUT_DIR, 'bot_body.png'), 'PNG')
arm_l.save(os.path.join(OUT_DIR, 'bot_arm_l.png'), 'PNG')

print('RIGHT_ARM_SEAMLESS_RESTORED_SUCCESS')
