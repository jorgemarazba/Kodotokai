import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionStore } from './session'
import { useStatsStore } from './stats'

export interface LegalCitation {
  lawName: string
  articleNumber: string
  excerpt: string
}

export type AvatarGesture = 'idle' | 'greeting' | 'explaining' | 'affirming' | 'denying'

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

export interface VoiceOption {
  id: string
  label: string
  neuralVoice: string
  neuralRate: string
  neuralPitch: string
  pitch: number
  rate: number
  voiceName?: string
}

// Voces Neuronales Masculinas reales (edge-tts) + respaldo Web Speech
const DEFAULT_VOICE_PROFILES: VoiceOption[] = [
  {
    id: 'neural-gonzalo-co',
    label: '🇨🇴 Gonzalo Neural · Colombiano Joven (IA)',
    neuralVoice: 'es-CO-GonzaloNeural',
    neuralRate: '+4%',
    neuralPitch: '-1Hz',
    pitch: 0.92,
    rate: 1.04,
  },
  {
    id: 'neural-jorge-mx',
    label: '🇲🇽 Jorge Neural · Ejecutivo Cálido (IA)',
    neuralVoice: 'es-MX-JorgeNeural',
    neuralRate: '+2%',
    neuralPitch: '-2Hz',
    pitch: 0.88,
    rate: 1.02,
  },
  {
    id: 'neural-alvaro-es',
    label: '🇪🇸 Álvaro Neural · Abogado Senior Grave (IA)',
    neuralVoice: 'es-ES-AlvaroNeural',
    neuralRate: '+0%',
    neuralPitch: '-3Hz',
    pitch: 0.8,
    rate: 0.98,
  },
  {
    id: 'neural-tomas-ar',
    label: '🇦🇷 Tomás Neural · Asesor Dinámico (IA)',
    neuralVoice: 'es-AR-TomasNeural',
    neuralRate: '+5%',
    neuralPitch: '+0Hz',
    pitch: 0.94,
    rate: 1.06,
  },
]

const WELCOME_TEXT =
  'Hola, soy Remi-915, tu abogado orientador virtual. ¿En qué tema legal te puedo orientar hoy? Presiona el micrófono o escribe tu consulta.'

export const useChatStore = defineStore('chat', () => {
  const sessionStore = useSessionStore()
  const statsStore = useStatsStore()

  const conversations = ref<ConversationItem[]>([])
  const activeConversationId = ref<string>('')
  const avatarState = ref<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
  const avatarEmotion = ref<'neutral' | 'happy' | 'empatia' | 'serio'>('neutral')
  const avatarGesture = ref<AvatarGesture>('idle')
  const gestureStartedAt = ref<number>(0)
  const currentViseme = ref<'aa' | 'ee' | 'ih' | 'oh' | 'ou' | 'sil'>('sil')
  const liveSubtitle = ref<string>(WELCOME_TEXT)

  const availableVoices = ref<VoiceOption[]>([...DEFAULT_VOICE_PROFILES])
  const selectedVoiceId = ref<string>('neural-gonzalo-co')
  const voicePitch = ref<number>(0.92)
  const voiceRate = ref<number>(1.04)

  let visemeInterval: ReturnType<typeof setInterval> | null = null
  let currentAudio: HTMLAudioElement | null = null
  let speechStarted = false
  let welcomeDone = false
  const neuralTtsAvailable = ref<boolean | null>(null)

  async function checkNeuralTtsStatus(): Promise<boolean> {
    if (neuralTtsAvailable.value === true) return true
    try {
      const res = await fetch('/health')
      if (res.ok) {
        const data = await res.json()
        neuralTtsAvailable.value = data?.neural_tts === true
        return neuralTtsAvailable.value
      }
    } catch {
      // ignorar
    }
    neuralTtsAvailable.value = false
    return false
  }

  function loadSpanishVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const rawVoices = window.speechSynthesis.getVoices()
    const spanish = rawVoices.filter((v) => v.lang.toLowerCase().startsWith('es'))

    const systemOptions: VoiceOption[] = spanish.map((v) => ({
      id: `sys-${v.name}`,
      label: `🔊 Navegador: ${v.name.replace(/Microsoft |Online \(Natural\) - /g, '')} (${v.lang})`,
      neuralVoice: '',
      neuralRate: '+0%',
      neuralPitch: '+0Hz',
      pitch: voicePitch.value,
      rate: voiceRate.value,
      voiceName: v.name,
    }))

    availableVoices.value = [...DEFAULT_VOICE_PROFILES, ...systemOptions]
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    loadSpanishVoices()
    window.speechSynthesis.onvoiceschanged = () => {
      loadSpanishVoices()
    }
    setTimeout(loadSpanishVoices, 300)
    setTimeout(loadSpanishVoices, 1000)
  }

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
      messages: [],
    }
    conversations.value.unshift(newConv)
    activeConversationId.value = newConv.id
    liveSubtitle.value = WELCOME_TEXT
  }

  // Saludo de bienvenida en audio al ingresar a la plataforma.
  // Los navegadores pueden bloquear el audio automático: si no sonó, se reproduce en la primera interacción.
  function playWelcomeGreeting() {
    if (welcomeDone || typeof window === 'undefined') return
    welcomeDone = true

    speakWithLipSync(WELCOME_TEXT, 'happy')

    const retryOnGesture = () => {
      window.removeEventListener('pointerdown', retryOnGesture)
      window.removeEventListener('keydown', retryOnGesture)
      if (!speechStarted) speakWithLipSync(WELCOME_TEXT, 'happy')
    }
    window.addEventListener('pointerdown', retryOnGesture)
    window.addEventListener('keydown', retryOnGesture)
  }
  function selectConversation(id: string) {
    activeConversationId.value = id
    const conv = activeConversation.value
    if (conv && conv.messages.length > 0) {
      liveSubtitle.value = conv.messages[conv.messages.length - 1]!.content
    }
  }

  function startLipSyncAnimation() {
    const visemePool: Array<'aa' | 'ee' | 'ih' | 'oh' | 'ou'> = ['aa', 'ee', 'ih', 'oh', 'ou']
    if (visemeInterval) clearInterval(visemeInterval)
    avatarState.value = 'speaking'

    visemeInterval = setInterval(() => {
      const randomViseme = visemePool[Math.floor(Math.random() * visemePool.length)]!
      currentViseme.value = Math.random() > 0.2 ? randomViseme : 'sil'
    }, 105)
  }

  function pickBestSystemVoice(preferredName?: string): SpeechSynthesisVoice | undefined {
    const rawVoices = window.speechSynthesis.getVoices()
    const spanish = rawVoices.filter((v) => v.lang.toLowerCase().startsWith('es'))
    if (spanish.length === 0) return undefined

    if (preferredName) {
      const exact = spanish.find((v) => v.name === preferredName)
      if (exact) return exact
    }

    const preferredKeywords = [
      'gonzalo',
      'alvaro',
      'jorge',
      'raul',
      'pablo',
      'tomas',
      'sebastian',
      'natural',
      'google español de estados unidos',
      'google español',
    ]
    for (const kw of preferredKeywords) {
      const found = spanish.find((v) => v.name.toLowerCase().includes(kw))
      if (found) return found
    }
    return spanish[0]
  }

  function pitchNumberToHz(pitchVal: number, baseHz: string): string {
    if (pitchVal <= 0.78) return '-6Hz'
    if (pitchVal <= 0.88) return '-3Hz'
    if (pitchVal >= 0.98) return '+1Hz'
    return baseHz
  }

  async function speakWithLipSync(
    text: string,
    emotion: 'neutral' | 'happy' | 'empatia' | 'serio' = 'empatia'
  ) {
    const cleanText = text.replace(/\[Source:[^\]]+\]/g, '').replace(/\*\*/g, '').trim()
    if (!cleanText) return

    stopSpeaking()
    speechStarted = false
    avatarEmotion.value = emotion
    liveSubtitle.value = cleanText
    avatarGesture.value = detectGestureFromText(cleanText)
    gestureStartedAt.value = performance.now()

    const selectedOption =
      availableVoices.value.find((o) => o.id === selectedVoiceId.value) || DEFAULT_VOICE_PROFILES[0]!

    // 1. Intentar primero la Voz Neuronal Masculina (/v1/tts con edge-tts) solo si /health confirma neural_tts: true
    if (selectedOption.neuralVoice && (await checkNeuralTtsStatus())) {
      try {
        const res = await fetch('/v1/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            voice: selectedOption.neuralVoice,
            rate: selectedOption.neuralRate,
            pitch: pitchNumberToHz(voicePitch.value, selectedOption.neuralPitch),
          }),
        })

        if (res.ok) {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          currentAudio = audio

          audio.onplay = () => {
            speechStarted = true
            startLipSyncAnimation()
          }
          audio.onended = () => {
            URL.revokeObjectURL(url)
            stopSpeaking()
          }
          audio.onerror = () => {
            URL.revokeObjectURL(url)
            stopSpeaking()
          }

          await audio.play()
          return
        }
      } catch {
        // Si uvicorn no se ha reiniciado con edge-tts, usar respaldo inmediato de voz del navegador
      }
    }

    // 2. Respaldo con Web Speech API del navegador
    startLipSyncAnimation()
    if ('speechSynthesis' in window) {
      loadSpanishVoices()
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(cleanText)
      const chosenVoice = pickBestSystemVoice(selectedOption.voiceName)

      if (chosenVoice) {
        utterance.voice = chosenVoice
        utterance.lang = chosenVoice.lang
      } else {
        utterance.lang = 'es-CO'
      }

      utterance.pitch = voicePitch.value
      utterance.rate = voiceRate.value

      utterance.onstart = () => {
        speechStarted = true
      }
      utterance.onend = () => {
        stopSpeaking()
      }
      utterance.onerror = () => {
        stopSpeaking()
      }
      window.speechSynthesis.speak(utterance)
    } else {
      const durationMs = Math.min(12000, Math.max(2500, cleanText.split(' ').length * 320))
      setTimeout(() => stopSpeaking(), durationMs)
    }
  }

  function stopSpeaking() {
    if (currentAudio) {
      try {
        currentAudio.pause()
        currentAudio.currentTime = 0
      } catch {
        // ignorar
      }
      currentAudio = null
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    if (visemeInterval) {
      clearInterval(visemeInterval)
      visemeInterval = null
    }
    currentViseme.value = 'sil'
    avatarState.value = 'idle'
    avatarGesture.value = 'idle'
  }

  function applyVoiceProfile(profileId: string) {
    selectedVoiceId.value = profileId
    const found = availableVoices.value.find((o) => o.id === profileId)
    if (found) {
      voicePitch.value = found.pitch
      voiceRate.value = found.rate
    }
    testSelectedVoice()
  }

  function testSelectedVoice() {
    speakWithLipSync(
      `Hola, soy Remi 915. Así suena mi nueva voz configurada para orientarte.`,
      'happy'
    )
  }

  function normalizeRagSources(rawSources: unknown): LegalCitation[] {
    if (!Array.isArray(rawSources)) return []
    return rawSources.map((item, idx) => {
      if (typeof item === 'string') {
        const cleanName = item.replace('.md', '').replace(/_/g, ' ')
        return {
          lawName: cleanName.toUpperCase(),
          articleNumber: 'Base RAG verificada',
          excerpt: item,
        }
      }
      return {
        lawName: `Fuente RAG #${idx + 1}`,
        articleNumber: 'Documento local',
        excerpt: '',
      }
    })
  }

  async function sendUserMessage(content: string, mode: 'text' | 'voice' = 'text') {
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
    liveSubtitle.value = 'Remi-915 consultando RAG + Ollama en tiempo real...'
    const startMs = performance.now()

    const botMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'ASSISTANT',
      content: '',
      emotion: 'empatia',
      sources: [],
      createdAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    }
    conv.messages.push(botMsg)
    const reactiveBotMsg = conv.messages[conv.messages.length - 1]!

    try {
      const response = await fetch('/v1/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: content.trim(),
        }),
      })

      if (response.ok && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const block of lines) {
            const line = block.trim()
            if (!line.startsWith('data:')) continue
            const payload = line.replace(/^data:\s*/, '').trim()
            if (payload === '[DONE]') break

            try {
              const parsed = JSON.parse(payload)
              if (parsed.sources) {
                reactiveBotMsg.sources = normalizeRagSources(parsed.sources)
              }
              if (parsed.delta) {
                if (!reactiveBotMsg.responseTimeMs) {
                  reactiveBotMsg.responseTimeMs = Math.round(performance.now() - startMs)
                }
                reactiveBotMsg.content += parsed.delta
                liveSubtitle.value = reactiveBotMsg.content
              }
            } catch {
              // Ignorar fragmentos incompletos
            }
          }
        }

        if (reactiveBotMsg.content.trim()) {
          statsStore.logQuery({
            question: content,
            responseMs: reactiveBotMsg.responseTimeMs ?? Math.round(performance.now() - startMs),
            origin: 'backend',
            mode,
            laws: (reactiveBotMsg.sources ?? []).map((s) => s.lawName),
          })
          speakWithLipSync(reactiveBotMsg.content, 'empatia')
          return
        }
      }
    } catch {
      // Respaldo local
    }

    if (!reactiveBotMsg.content.trim()) {
      reactiveBotMsg.content = 'No fue posible conectar con el servidor backend en http://localhost:8000. Por favor verifica que el backend esté ejecutándose.'
      reactiveBotMsg.emotion = 'serio'
      reactiveBotMsg.responseTimeMs = Math.round(performance.now() - startMs)
      speakWithLipSync(reactiveBotMsg.content, 'serio')
    }
  }

  return {
    playWelcomeGreeting,
    conversations,
    userConversations,
    activeConversationId,
    activeConversation,
    avatarState,
    avatarEmotion,
    avatarGesture,
    gestureStartedAt,
    currentViseme,
    liveSubtitle,
    availableVoices,
    selectedVoiceId,
    voicePitch,
    voiceRate,
    loadSpanishVoices,
    applyVoiceProfile,
    startNewChat,
    selectConversation,
    sendUserMessage,
    speakWithLipSync,
    stopSpeaking,
    testSelectedVoice,
  }
})
