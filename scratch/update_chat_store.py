import os

PATH = os.path.abspath('src/stores/chat.ts')
with open(PATH, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add AvatarGesture type and detectGestureFromText
if 'export type AvatarGesture' not in code:
    insertion_marker = 'export interface ChatMessage {'
    gesture_type = '''export type AvatarGesture = 'idle' | 'greeting' | 'explaining' | 'affirming' | 'denying'

export function detectGestureFromText(text: string): AvatarGesture {
  const lower = text.toLowerCase().trim()
  if (
    lower.includes('hola') ||
    lower.includes('bienvenid') ||
    lower.includes('buenos días') ||
    lower.includes('buenas tardes') ||
    lower.includes('buenas noches') ||
    lower.includes('un placer') ||
    lower.includes('saludos') ||
    lower.includes('mucho gusto')
  ) {
    return 'greeting'
  }
  if (
    lower.includes('no tengo') ||
    lower.includes('no encuentro') ||
    lower.includes('lo siento') ||
    lower.includes('disculpa') ||
    lower.includes('lamentablemente') ||
    lower.includes('no dispongo') ||
    lower.includes('no se encuentra') ||
    lower.includes('no fue posible') ||
    lower.includes('no es posible') ||
    lower.includes('desafortunadamente')
  ) {
    return 'denying'
  }
  if (
    lower.includes('claro') ||
    lower.includes('por supuesto') ||
    lower.includes('con gusto') ||
    lower.includes('exactamente') ||
    lower.includes('correcto') ||
    lower.includes('efectivamente') ||
    lower.includes('totalmente')
  ) {
    return 'affirming'
  }
  return 'explaining'
}

'''
    code = code.replace(insertion_marker, gesture_type + insertion_marker)

# 2. Add avatarGesture and gestureStartedAt refs inside store
if 'const avatarGesture = ref<AvatarGesture>' not in code:
    state_marker = "const avatarEmotion = ref<'neutral' | 'happy' | 'empatia' | 'serio'>('neutral')"
    new_state = state_marker + "\n  const avatarGesture = ref<AvatarGesture>('idle')\n  const gestureStartedAt = ref<number>(0)"
    code = code.replace(state_marker, new_state)

# 3. In speakWithLipSync, set avatarGesture and gestureStartedAt
if 'avatarGesture.value = detectGestureFromText(cleanText)' not in code:
    lip_sync_marker = "liveSubtitle.value = cleanText"
    new_lip_sync = "liveSubtitle.value = cleanText\n    avatarGesture.value = detectGestureFromText(cleanText)\n    gestureStartedAt.value = performance.now()"
    code = code.replace(lip_sync_marker, new_lip_sync)

# 4. In stopSpeaking, reset avatarGesture to idle
if "avatarGesture.value = 'idle'" not in code:
    stop_marker = "avatarState.value = 'idle'"
    new_stop = "avatarState.value = 'idle'\n    avatarGesture.value = 'idle'"
    code = code.replace(stop_marker, new_stop)

# 5. In return statement, return avatarGesture and gestureStartedAt
if 'avatarGesture,' not in code:
    return_marker = 'avatarEmotion,'
    new_return = 'avatarEmotion,\n    avatarGesture,\n    gestureStartedAt,'
    code = code.replace(return_marker, new_return)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(code)

print('CHAT_STORE_GESTURES_UPDATED')
