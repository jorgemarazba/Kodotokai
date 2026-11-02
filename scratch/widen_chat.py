import os

PATH = os.path.abspath('src/views/ChatView.vue')
with open(PATH, 'r', encoding='utf-8') as f:
    text = f.read()

# Normalize newlines
text = text.replace('\r\n', '\n')

# Widen main container
text = text.replace('max-w-4xl w-full mx-auto', 'max-w-6xl w-full mx-auto')
text = text.replace('max-w-4xl mx-auto flex items-center gap-2.5', 'max-w-6xl mx-auto flex items-center gap-2.5')

# Widen bubble
target_str = """        <div
          class="max-w-2xl rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed"
          :class="
            msg.sender === 'USER'
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
          "
        >"""

replacement_str = """        <div
          class="rounded-2xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed"
          :class="
            msg.sender === 'USER'
              ? 'max-w-2xl sm:max-w-3xl bg-blue-600 text-white rounded-br-none'
              : 'max-w-3xl sm:max-w-4xl xl:max-w-5xl bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none shadow-sm'
          "
        >"""

if target_str in text:
    text = text.replace(target_str, replacement_str)
    with open(PATH, 'w', encoding='utf-8') as f:
        f.write(text)
    print('WIDENED_SUCCESS')
else:
    print('Target not found!')
