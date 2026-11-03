import os
from PIL import Image, ImageDraw, ImageFilter

SRC = os.path.abspath("public/avatar/bot.png")
OUT_DIR = os.path.abspath("public/avatar")

img = Image.open(SRC).convert("RGBA")
W, H = img.size

# 1. MÁSCARA BRAZO IZQUIERDO (pantalla izquierda, manga blanca, puño, mano)
# El hombro conecta en (120, 460). El brazo baja hacia la izquierda y luego la mano va a la cadera en (160, 896).
poly_left_arm = [
    (0, 430),
    (115, 450),
    (135, 520),
    (155, 620),
    (168, 760),
    (165, 896),
    (0, 896),
]

mask_l = Image.new("L", (W, H), 0)
draw_l = ImageDraw.Draw(mask_l)
draw_l.polygon(poly_left_arm, fill=255)
# Suavizado de bordes
mask_l_blur = mask_l.filter(ImageFilter.GaussianBlur(1.5))

arm_l = Image.new("RGBA", (W, H), (0, 0, 0, 0))
arm_l.paste(img, (0, 0), mask=mask_l_blur)

# 2. MÁSCARA BRAZO DERECHO (pantalla derecha, manga blanca, banda roja, reloj, mano)
# El hombro conecta en (590, 450). El codo sale hacia (740, 680) y la muñeca con reloj entra hacia (570, 860).
poly_right_arm = [
    (585, 445),
    (752, 445),
    (752, 896),
    (555, 896),
    (548, 790),
    (552, 630),
    (575, 520),
]

mask_r = Image.new("L", (W, H), 0)
draw_r = ImageDraw.Draw(mask_r)
draw_r.polygon(poly_right_arm, fill=255)
mask_r_blur = mask_r.filter(ImageFilter.GaussianBlur(1.5))

arm_r = Image.new("RGBA", (W, H), (0, 0, 0, 0))
arm_r.paste(img, (0, 0), mask=mask_r_blur)

# 3. CUERPO BASE (Torso, cabeza, chaleco completo)
# Para el cuerpo, rellenamos o extendemos la textura del chaleco azul oscuro en los costados
# para que cuando el brazo se mueva no haya un hueco transparente.
body = img.copy()
body_draw = ImageDraw.Draw(body)

# Color base del chaleco azul oscuro en la cintura
vest_blue = (26, 43, 86, 255)
# Rellenar costados detrás de las muñecas
body_draw.rectangle([130, 750, 180, 896], fill=vest_blue)
body_draw.rectangle([540, 750, 600, 896], fill=vest_blue)
body = body.filter(ImageFilter.BoxBlur(0.5))
# Volver a pegar el centro intacto para no afectar los detalles del logo ni la cara
body.paste(img.crop((175, 0, 545, H)), (175, 0))

# Guardar
body_path = os.path.join(OUT_DIR, "bot_body.png")
arm_l_path = os.path.join(OUT_DIR, "bot_arm_l.png")
arm_r_path = os.path.join(OUT_DIR, "bot_arm_r.png")

body.save(body_path, "PNG")
arm_l.save(arm_l_path, "PNG")
arm_r.save(arm_r_path, "PNG")

print("LAYERS_CREATED_SUCCESS")
