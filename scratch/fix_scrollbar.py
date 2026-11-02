import os

# 1. Update ChatView.vue
CHAT_PATH = os.path.abspath('src/views/ChatView.vue')
with open(CHAT_PATH, 'r', encoding='utf-8') as f:
    chat_text = f.read().replace('\r\n', '\n')

chat_old = 'class="w-80 xl:w-96 shrink-0 border-l border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 flex flex-col items-center justify-center overflow-y-auto"'
chat_new = 'class="w-80 xl:w-96 shrink-0 border-l border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 flex flex-col items-center justify-center overflow-hidden"'

if chat_old in chat_text:
    chat_text = chat_text.replace(chat_old, chat_new)
    with open(CHAT_PATH, 'w', encoding='utf-8') as f:
        f.write(chat_text)
    print('CHAT_VIEW_SCROLL_FIXED')
else:
    print('ChatView target not found!')

# 2. Update AvatarCanvas.vue
AVATAR_PATH = os.path.abspath('src/components/avatar/AvatarCanvas.vue')
with open(AVATAR_PATH, 'r', encoding='utf-8') as f:
    avatar_text = f.read().replace('\r\n', '\n')

avatar_old_template = """<template>
  <div class="relative w-full h-full flex flex-col items-center justify-center select-none py-2">
    <!-- Escenario del Personaje Completo con Encuadre Perfecto -->
    <div class="relative flex items-center justify-center w-full max-w-[340px]">"""

avatar_new_template = """<template>
  <div class="relative w-full h-full flex flex-col items-center justify-center select-none py-2 overflow-hidden">
    <!-- Escenario del Personaje Completo con Encuadre Perfecto -->
    <div class="relative flex items-center justify-center w-full max-w-full overflow-hidden">"""

if avatar_old_template in avatar_text:
    avatar_text = avatar_text.replace(avatar_old_template, avatar_new_template)
    avatar_text = avatar_text.replace('class="relative z-10 w-full h-auto', 'class="relative z-10 max-w-full h-auto')
    with open(AVATAR_PATH, 'w', encoding='utf-8') as f:
        f.write(avatar_text)
    print('AVATAR_CANVAS_SCROLL_FIXED')
else:
    print('AvatarCanvas target not found!')
