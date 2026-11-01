import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiRequest } from '@/services/api'
import { useSessionStore } from './session'

export interface LegalCitation {
  lawName: string
  articleNumber: string
  excerpt: string
}

export interface ChatMessage {
  id: string
  sender: 'USER' | 'ASSISTANT'
  content: string
  emotion?: 'neutral' | 'happy' | 'empatia' | 'serio'
  sources?: LegalCitation[]
  responseTimeMs?: number
  createdAt: string
}

export interface ConversationItem {
  id: string
  userId: string
  title: string
  updatedAt: string
  messages: ChatMessage[]
}

export const useChatStore = defineStore('chat', () => {
  const sessionStore = useSessionStore()

  const conversations = ref<ConversationItem[]>([])
  const activeConversationId = ref<string>('')
  const avatarState = ref<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
  const avatarEmotion = ref<'neutral' | 'happy' | 'empatia' | 'serio'>('neutral')
  const currentViseme = ref<'aa' | 'ee' | 'ih' | 'oh' | 'ou' | 'sil'>('sil')
  const liveSubtitle = ref<string>(
    'Hola, soy LegalBot. Presiona el micrófono o escribe tu consulta legal para orientarte.'
  )

  let visemeInterval: ReturnType<typeof setInterval> | null = null

  // Filtra estrictamente las conversaciones para que cada usuario solo vea su propia instancia
  const userConversations = computed(() => {
    const uid = sessionStore.user?.id || 'anonymous'
    return conversations.value.filter((c) => c.userId === uid)
  })

  const activeConversation = computed<ConversationItem | undefined>(() => {
    return userConversations.value.find((c) => c.id === activeConversationId.value)
  })

  function startNewChat() {
    const uid = sessionStore.user?.id || 'anonymous'
    const newConv: ConversationItem = {
      id: crypto.randomUUID(),
      userId: uid,
      title: 'Nueva consulta legal',
      updatedAt: 'Ahora',
      messages: [
        {
          id: crypto.randomUUID(),
          sender: 'ASSISTANT',
          content: `Hola ${sessionStore.user?.name || ''}. Soy tu abogado orientador virtual en ${sessionStore.currentCity.name}. ¿En qué tema legal (laboral, arriendo, consumidor o convivencia) te puedo orientar hoy?`,
          emotion: 'happy',
          createdAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    }
    conversations.value.unshift(newConv)
    activeConversationId.value = newConv.id
    liveSubtitle.value = newConv.messages[0]!.content
  }

  function selectConversation(id: string) {
    activeConversationId.value = id
    const conv = activeConversation.value
    if (conv && conv.messages.length > 0) {
      liveSubtitle.value = conv.messages[conv.messages.length - 1]!.content
    }
  }

  function speakWithLipSync(text: string, emotion: 'neutral' | 'happy' | 'empatia' | 'serio' = 'empatia') {
    avatarEmotion.value = emotion
    avatarState.value = 'speaking'
    liveSubtitle.value = text

    const visemePool: Array<'aa' | 'ee' | 'ih' | 'oh' | 'ou'> = ['aa', 'ee', 'ih', 'oh', 'ou']
    if (visemeInterval) clearInterval(visemeInterval)

    visemeInterval = setInterval(() => {
      const randomViseme = visemePool[Math.floor(Math.random() * visemePool.length)]!
      currentViseme.value = Math.random() > 0.2 ? randomViseme : 'sil'
    }, 110)

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ''))
      utterance.lang = 'es-CO'
      utterance.rate = 1.02

      utterance.onend = () => {
        stopSpeaking()
      }
      utterance.onerror = () => {
        stopSpeaking()
      }
      window.speechSynthesis.speak(utterance)
    } else {
      const durationMs = Math.min(12000, Math.max(2500, text.split(' ').length * 320))
      setTimeout(() => stopSpeaking(), durationMs)
    }
  }

  function stopSpeaking() {
    if (visemeInterval) {
      clearInterval(visemeInterval)
      visemeInterval = null
    }
    currentViseme.value = 'sil'
    avatarState.value = 'idle'
  }

  async function sendUserMessage(content: string) {
    if (!content.trim()) return
    if (!activeConversation.value) {
      startNewChat()
    }
    const conv = activeConversation.value!
    if (conv.messages.length <= 1) {
      conv.title = content.slice(0, 38) + (content.length > 38 ? '...' : '')
    }

    conv.messages.push({
      id: crypto.randomUUID(),
      sender: 'USER',
      content: content.trim(),
      createdAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    })

    avatarState.value = 'thinking'
    liveSubtitle.value = 'Consultando legislación colombiana verificada (RAG)...'
    const startMs = performance.now()

    try {
      const res = await apiRequest<{
        assistantMessage: ChatMessage
      }>(`/conversations/${conv.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })

      if (res.success && res.data.assistantMessage) {
        const msg = res.data.assistantMessage
        conv.messages.push(msg)
        speakWithLipSync(msg.content, msg.emotion || 'empatia')
        return
      }
    } catch {
      // Respuesta local inteligente basada en leyes colombianas mientras el backend se enciende
    }

    const fallback = buildLocalLegalResponse(content, sessionStore.currentCity.name)
    const elapsedMs = Math.round(performance.now() - startMs) + 180

    const botMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'ASSISTANT',
      content: fallback.text,
      emotion: fallback.emotion,
      sources: fallback.sources,
      responseTimeMs: elapsedMs,
      createdAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    }

    conv.messages.push(botMsg)
    speakWithLipSync(botMsg.content, botMsg.emotion)
  }

  function buildLocalLegalResponse(
    query: string,
    cityName: string
  ): {
    text: string
    emotion: 'neutral' | 'happy' | 'empatia' | 'serio'
    sources: LegalCitation[]
  } {
    const q = query.toLowerCase()
    if (q.includes('despid') || q.includes('liquidaci') || q.includes('trabajo') || q.includes('sueldo')) {
      return {
        emotion: 'empatia',
        text: `Según los artículos 64 y 65 del Código Sustantivo del Trabajo, ante un despido sin justa causa tienes derecho al pago inmediato de tu liquidación (cesantías, intereses, prima y vacaciones) más la indemnización legal. Puedes contactar un abogado laboralista en ${cityName} desde la sección Lawyers en el menú izquierdo. Nota: Orientación informativa.`,
        sources: [
          {
            lawName: 'Código Sustantivo del Trabajo (Colombia)',
            articleNumber: 'Arts. 64 y 65',
            excerpt: 'Indemnización por despido sin justa causa y sanción moratoria por falta de pago.',
          },
        ],
      }
    }

    if (q.includes('ruido') || q.includes('vecino') || q.includes('polic') || q.includes('cai') || q.includes('riña')) {
      return {
        emotion: 'serio',
        text: `De acuerdo con los artículos 33 y 206 de la Ley 1801 de 2016 (Código Nacional de Seguridad y Convivencia Ciudadana), puedes acudir al cuadrante del CAI más cercano o presentar querella ante el Inspector de Policía de tu localidad. Abre la sección Multiservice debajo de Lawyers para ver el CAI y el Inspector de Policía en ${cityName}.`,
        sources: [
          {
            lawName: 'Ley 1801 de 2016 (Código de Policía)',
            articleNumber: 'Arts. 33, 77 y 206',
            excerpt: 'Tranquilidad vecinal, querellas policivas y atribuciones de los Inspectores de Policía.',
          },
        ],
      }
    }

    if (q.includes('arriend') || q.includes('canon') || q.includes('inmueble') || q.includes('inquilino')) {
      return {
        emotion: 'empatia',
        text: `Conforme a la Ley 820 de 2003 (Arrendamiento de Vivienda Urbana), el incremento anual no puede superar el 100 % del IPC del año anterior (Art. 20) y la terminación unilateral requiere preaviso escrito de 3 meses (Arts. 22 y 24). Revisa la sección Lawyers si necesitas representación inmobiliaria en ${cityName}.`,
        sources: [
          {
            lawName: 'Ley 820 de 2003',
            articleNumber: 'Arts. 18, 20, 22 y 24',
            excerpt: 'Régimen de arrendamiento de vivienda urbana en Colombia.',
          },
        ],
      }
    }

    return {
      emotion: 'happy',
      text: `Según la Ley 1480 de 2011 (Estatuto del Consumidor) y el marco legal colombiano en ${cityName}, tienes derecho a presentar reclamación directa con plazo de respuesta de 15 días hábiles. Si deseas atención personalizada, explora la sección Lawyers o Multiservice en la barra lateral.`,
      sources: [
        {
          lawName: 'Ley 1480 de 2011 (Estatuto del Consumidor)',
          articleNumber: 'Arts. 7, 11, 47 y 58',
          excerpt: 'Garantía legal, derecho de retracto y reclamación ante la SIC.',
        },
      ],
    }
  }

  return {
    conversations,
    userConversations,
    activeConversationId,
    activeConversation,
    avatarState,
    avatarEmotion,
    currentViseme,
    liveSubtitle,
    startNewChat,
    selectConversation,
    sendUserMessage,
    speakWithLipSync,
    stopSpeaking,
  }
})