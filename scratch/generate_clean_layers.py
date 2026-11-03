import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

SRC = os.path.abspath('public/avatar/bot.png')
OUT_DIR = os.path.abspath('public/avatar')

img = Image.open(SRC).convert('RGBA')
W, H = img.size

# Colors from character
vest_blue = (20, 36, 78, 255)

# --- 1. RIGHT ARM (Arm with smartwatch) ---
mask_r = Image.new('L', (W, H), 0)
draw_r = ImageDraw.Draw(mask_r)

# Shoulder socket ellipse + arm polygon
draw_r.ellipse([550, 415, 640, 500], fill=255)
poly_r = [
    (565, 430),
    (752, 430),
    (752, 896),
    (530, 896),
    (535, 830),
    (555, 760),
    (555, 600),
    (565, 480)
]
draw_r.polygon(poly_r, fill=255)
mask_r_blur = mask_r.filter(ImageFilter.GaussianBlur(1.5))

arm_r = Image.new('RGBA', (W, H), (0, 0, 0, 0))
arm_r.paste(img, (0, 0), mask=mask_r_blur)

# --- 2. LEFT ARM ---
mask_l = Image.new('L', (W, H), 0)
draw_l = ImageDraw.Draw(mask_l)
draw_l.ellipse([80, 415, 160, 500], fill=255)
poly_l = [
    (0, 430),
    (150, 430),
    (155, 520),
    (170, 680),
    (170, 896),
    (0, 896)
]
draw_l.polygon(poly_l, fill=255)
mask_l_blur = mask_l.filter(ImageFilter.GaussianBlur(1.5))

arm_l = Image.new('RGBA', (W, H), (0, 0, 0, 0))
arm_l.paste(img, (0, 0), mask=mask_l_blur)

# --- 3. BODY (Head, Face, Torso with filled background behind limbs) ---
body = img.copy()
body_arr = np.array(body)

# Clear outer arm areas below shoulders
for y in range(450, H):
    xl = int(105 + (y - 450) * 0.10)
    body_arr[y, :xl] = [0, 0, 0, 0]

for y in range(450, H):
    xr = int(605 - (y - 450) * 0.11)
    body_arr[y, xr:] = [0, 0, 0, 0]

body_img = Image.fromarray(body_arr)
draw_body = ImageDraw.Draw(body_img)

# Shoulder sockets on body
draw_body.ellipse([85, 420, 160, 495], fill=vest_blue)
draw_body.ellipse([555, 420, 635, 495], fill=vest_blue)

# Fill behind resting wrists / hips
draw_body.polygon([(110, 750), (160, 750), (160, 896), (110, 896)], fill=vest_blue)
draw_body.polygon([(525, 750), (595, 750), (580, 896), (525, 896)], fill=vest_blue)

# Re-paste central torso/face so vest logo and tie stay crisp
body_img.paste(img.crop((165, 0, 535, H)), (165, 0))

# Save all
body_path = os.path.join(OUT_DIR, 'bot_body.png')
arm_l_path = os.path.join(OUT_DIR, 'bot_arm_l.png')
arm_r_path = os.path.join(OUT_DIR, 'bot_arm_r.png')

body_img.save(body_path, 'PNG')
arm_l.save(arm_l_path, 'PNG')
arm_r.save(arm_r_path, 'PNG')

print('CLEAN_LAYERS_GENERATED_SUCCESS')
