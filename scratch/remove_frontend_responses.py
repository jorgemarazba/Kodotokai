import os

PATH = os.path.abspath('src/stores/chat.ts')
with open(PATH, 'r', encoding='utf-8') as f:
    code = f.read().replace('\r\n', '\n')

# 1. Remove isQuickGreeting function
quick_start = code.find('  function isQuickGreeting(text: string): boolean {')
if quick_start != -1:
    quick_end = code.find('  async function sendUserMessage(', quick_start)
    code = code[:quick_start] + code[quick_end:]
    print('REMOVED_IS_QUICK_GREETING_DEF')

# 2. Remove isQuickGreeting call inside sendUserMessage
block_start = code.find('    if (isQuickGreeting(content)) {')
if block_start != -1:
    block_end = code.find('    avatarState.value = \'thinking\'', block_start)
    code = code[:block_start] + code[block_end:]
    print('REMOVED_QUICK_GREETING_CALL')

# 3. Replace buildLocalLegalResponse fallback with clean backend error
fallback_old = """    const fallback = buildLocalLegalResponse(content)
    reactiveBotMsg.content = fallback.text
    reactiveBotMsg.emotion = fallback.emotion
    reactiveBotMsg.sources = fallback.sources
    reactiveBotMsg.responseTimeMs = Math.round(performance.now() - startMs)
    statsStore.logQuery({
      question: content,
      responseMs: reactiveBotMsg.responseTimeMs,
      origin: 'local',
      mode,
      laws: fallback.sources.map((s) => s.lawName),
    })
    speakWithLipSync(reactiveBotMsg.content, fallback.emotion)
  }

  function buildLocalLegalResponse(
    query: string
  ): {
    text: string
    emotion: 'neutral' | 'happy' | 'empatia' | 'serio'
  sources: LegalCitation[]
  } {
    const q = query.toLowerCase()
    if (q.includes('despid') || q.includes('liquidaci') || q.includes('trabajo') || q.includes('sueldo')) {
      return {
        emotion: 'empatia',
        text: `Según los artículos 64 y 65 del Código Sustantivo del Trabajo, ante un despido sin justa causa tienes derecho al pago inmediato de tu liquidación más la indemnización legal. Puedes contactar un abogado laboralista desde la sección Lawyers.`,
        sources: [
          {
            lawName: 'CÓDIGO SUSTANTIVO DEL TRABAJO',
            articleNumber: 'Arts. 64 y 65',
            excerpt: 'Indemnización por despido sin justa causa.',
          },
        ],
      }
    }

    return {
      emotion: 'empatia',
      text: `Para orientarte sobre "${query}", te aconsejo radicar primero un Derecho de Petición (Ley 1755 de 2015, plazo de 15 días hábiles) o consultar directamente a un especialista en la sección Lawyers del menú izquierdo.`,
      sources: [
        {
          lawName: 'LEY 1755 DE 2015',
          articleNumber: 'Art. 23 C.P.',
          excerpt: 'Derecho fundamental de petición.',
        },
      ],
    }
  }"""

fallback_new = """    if (!reactiveBotMsg.content.trim()) {
      reactiveBotMsg.content = 'No fue posible conectar con el servidor backend en http://localhost:8000. Por favor verifica que el backend esté ejecutándose.'
      reactiveBotMsg.emotion = 'serio'
      reactiveBotMsg.responseTimeMs = Math.round(performance.now() - startMs)
      speakWithLipSync(reactiveBotMsg.content, 'serio')
    }
  }"""

if fallback_old in code:
    code = code.replace(fallback_old, fallback_new)
    print('REMOVED_BUILD_LOCAL_LEGAL_RESPONSE')
else:
    print('Fallback block not found!')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(code)

print('CHAT_STORE_CLEANED_SUCCESS')
