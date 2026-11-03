import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionStore } from './session'
import { useStatsStore } from './stats'
import { generateTranslogixResponse } from '@/services/translogixAssistant'

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
    label: '🇨🇴 Remi Neural · Asesor Logístico Senior (IA)',
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
  'Hola, soy Remi, tu asesor logístico de TransLogix Colombia. ¿En qué servicio de transporte, cotización de fletes o rastreo te puedo orientar hoy?'

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

  const isBackendEnabled = import.meta.env.VITE_ENABLE_BACKEND === 'true'

  async function checkNeuralTtsStatus(): Promise<boolean> {
    if (!isBackendEnabled) return false
    if (neuralTtsAvailable.value !== null) return neuralTtsAvailable.value
    try {
      const controller = new AbortController()
      const to = setTimeout(() => controller.abort(), 4000)
      const res = await fetch('/health', { signal: controller.signal })
      clearTimeout(to)
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
      title: 'Nueva consulta logística',
      updatedAt: 'Ahora',
      messages: [],
    }
    conversations.value.unshift(newConv)
    activeConversationId.value = newConv.id
    liveSubtitle.value = WELCOME_TEXT
  }


  function startNewInstance() {
    stopSpeaking()
    startNewChat()
    welcomeDone = false
    speechStarted = false
    playWelcomeGreeting()
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

  function cleanTextForSpeech(text: string): string {
    return text
      .replace(/\[Source:[^\]]+\]/g, '')
      .replace(/\[\d+\]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[*_#`~>|]/g, ' ')
      .replace(/\s*-\s+/g, ', ')
      .replace(/×/g, ' por ')
      .replace(/\//g, ' dividido entre ')
      .replace(/\+/g, ' más ')
      .replace(/%/g, ' por ciento ')
      .replace(/\$/g, ' pesos ')
      .replace(/[()]/g, ', ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function charToViseme(ch: string): 'aa' | 'ee' | 'ih' | 'oh' | 'ou' | 'sil' {
    const c = ch.toLowerCase()
    if (c === 'a' || c === 'á') return 'aa'
    if (c === 'e' || c === 'é') return 'ee'
    if (c === 'i' || c === 'í' || c === 'y') return 'ih'
    if (c === 'o' || c === 'ó') return 'oh'
    if (c === 'u' || c === 'ú' || c === 'ü' || c === 'w') return 'ou'
    if (c === 'm' || c === 'p' || c === 'b' || c === 'v' || c === 'f') return 'sil'
    if (',.;:?!—-()'.includes(c)) return 'sil'
    return 'ee'
  }

  function buildSyllableVisemes(text: string): Array<{ viseme: 'aa' | 'ee' | 'ih' | 'oh' | 'ou' | 'sil'; charIndex: number }> {
    const list: Array<{ viseme: 'aa' | 'ee' | 'ih' | 'oh' | 'ou' | 'sil'; charIndex: number }> = []
    const clean = text.toLowerCase()
    let i = 0
    while (i < clean.length) {
      const ch = clean[i]!
      if (' \t\n,.;:?!-'.includes(ch)) {
        list.push({ viseme: 'sil', charIndex: i })
        i++
        continue
      }
      if ('aeiouáéíóúü'.includes(ch)) {
        let v: 'aa' | 'ee' | 'ih' | 'oh' | 'ou' = 'aa'
        if (ch === 'a' || ch === 'á') v = 'aa'
        else if (ch === 'e' || ch === 'é') v = 'ee'
        else if (ch === 'i' || ch === 'í') v = 'ih'
        else if (ch === 'o' || ch === 'ó') v = 'oh'
        else if (ch === 'u' || ch === 'ú' || ch === 'ü') v = 'ou'
        list.push({ viseme: v, charIndex: i })
        // Micro cierre consonántico natural entre sílabas
        list.push({ viseme: 'sil', charIndex: i })
        i++
        continue
      }
      if ('mpbv'.includes(ch)) {
        list.push({ viseme: 'sil', charIndex: i })
      } else {
        list.push({ viseme: 'ih', charIndex: i })
      }
      i++
    }
    return list
  }

  let fallbackStopTimer: ReturnType<typeof setTimeout> | null = null
  let activeUtteranceRef: SpeechSynthesisUtterance | null = null

  function startLipSyncAnimation(spokenText = '') {
    if (visemeInterval) clearInterval(visemeInterval)
    avatarState.value = 'speaking'

    const sequence = buildSyllableVisemes(spokenText)
    if (sequence.length === 0) {
      const fallbackPool: Array<'aa' | 'ee' | 'ih' | 'oh' | 'ou'> = ['aa', 'ee', 'ih', 'oh', 'ou']
      let step = 0
      visemeInterval = setInterval(() => {
        step++
        currentViseme.value = step % 4 === 0 ? 'sil' : fallbackPool[step % fallbackPool.length]!
      }, 95)
      return
    }

    let seqIdx = 0
    visemeInterval = setInterval(() => {
      const item = sequence[seqIdx % sequence.length]
      if (item) {
        currentViseme.value = item.viseme
      }
      seqIdx++
    }, 110)
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
    const speechClean = cleanTextForSpeech(text)
    if (!speechClean) return

    stopSpeaking()
    speechStarted = false
    avatarEmotion.value = emotion
    liveSubtitle.value = speechClean
    avatarGesture.value = detectGestureFromText(speechClean)
    gestureStartedAt.value = performance.now()

    const selectedOption =
      availableVoices.value.find((o) => o.id === selectedVoiceId.value) || DEFAULT_VOICE_PROFILES[0]!

    // 1. Intentar primero la Voz Neuronal Masculina (/v1/tts con edge-tts) si está disponible
    if (selectedOption.neuralVoice && (await checkNeuralTtsStatus())) {
      try {
        const res = await fetch('/v1/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: speechClean,
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
            startLipSyncAnimation(speechClean)
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
        // Fallback al sintetizador del sistema
      }
    }

    // 2. Respaldo inmediato y garantizado con Web Speech API
    startLipSyncAnimation(speechClean)
    const estimatedDurationMs = Math.min(18000, Math.max(2500, speechClean.split(/\s+/).length * 360))

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      loadSpanishVoices()
      try {
        window.speechSynthesis.resume()
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel()
        }
      } catch {
        // ignorar
      }

      const utterance = new SpeechSynthesisUtterance(speechClean)
      activeUtteranceRef = utterance
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
        avatarState.value = 'speaking'
      }

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (typeof event.charIndex === 'number' && event.charIndex >= 0) {
          const currentSlice = speechClean.slice(event.charIndex, event.charIndex + 4)
          const vowelMatch = currentSlice.match(/[aeiouáéíóú]/i)
          if (vowelMatch && vowelMatch[0]) {
            currentViseme.value = charToViseme(vowelMatch[0])
          }
        }
      }

      utterance.onend = () => {
        if (activeUtteranceRef === utterance) {
          stopSpeaking()
        }
      }

      utterance.onerror = (ev: SpeechSynthesisErrorEvent) => {
        if (ev.error === 'not-allowed' || ev.error === 'synthesis-failed' || ev.error === 'audio-busy') {
          if (fallbackStopTimer) clearTimeout(fallbackStopTimer)
          fallbackStopTimer = setTimeout(() => {
            if (activeUtteranceRef === utterance) stopSpeaking()
          }, estimatedDurationMs)
          return
        }
        if (activeUtteranceRef === utterance && speechStarted) {
          stopSpeaking()
        }
      }

      // Respaldo de seguridad
      if (fallbackStopTimer) clearTimeout(fallbackStopTimer)
      fallbackStopTimer = setTimeout(() => {
        if (activeUtteranceRef === utterance && !window.speechSynthesis.speaking) {
          stopSpeaking()
        }
      }, estimatedDurationMs + 1000)

      // Pequeño retardo de 35ms para evitar cancelación síncrona en Chromium
      setTimeout(() => {
        try {
          window.speechSynthesis.resume()
          window.speechSynthesis.speak(utterance)
        } catch {
          // continuar con animación
        }
      }, 35)
    } else {
      if (fallbackStopTimer) clearTimeout(fallbackStopTimer)
      fallbackStopTimer = setTimeout(() => stopSpeaking(), estimatedDurationMs)
    }
  }

  function stopSpeaking() {
    if (fallbackStopTimer) {
      clearTimeout(fallbackStopTimer)
      fallbackStopTimer = null
    }
    activeUtteranceRef = null
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
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel()
        }
      } catch {
        // ignorar
      }
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
      `Hola, soy Remi. Así suena mi voz configurada para orientarte en TransLogix Colombia.`,
      'happy'
    )
  }

  function normalizeRagSources(rawSources: unknown): LegalCitation[] {
    if (!Array.isArray(rawSources)) return []
    return rawSources.map((item, idx) => {
      if (item && typeof item === 'object') {
        const meta = (item as Record<string, unknown>).metadata as Record<string, unknown> | undefined || {}
        const sourceFile = meta.source || (item as Record<string, unknown>).lawName || `Fuente RAG #${idx + 1}`
        const cleanName = String(sourceFile).replace('.md', '').replace(/_/g, ' ')
        const section =
          meta.seccion && meta.seccion !== 'N/A'
            ? `Sección: ${meta.seccion}`
            : meta.categoria || (item as Record<string, unknown>).articleNumber || 'Documento local'
        const excerpt = (item as Record<string, unknown>).content || (item as Record<string, unknown>).excerpt || ''
        return {
          lawName: cleanName.toUpperCase(),
          articleNumber: String(section),
          excerpt: String(excerpt),
        }
      }
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
    liveSubtitle.value = 'Remi procesando tu consulta logística...'
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

    // 0. Detección en vivo de consulta de expediente PQRSD
    const radicadoMatch = content.match(/\bPQRSD-[0-9]{4}-[0-9]{6}\b/i)
    if (radicadoMatch && radicadoMatch[0]) {
      const radicado = radicadoMatch[0].toUpperCase()
      try {
        const resPqrs = await fetch(`/api/v1/pqrsd/${encodeURIComponent(radicado)}`)
        if (resPqrs.ok) {
          const caseData = await resPqrs.json()
          const respText = `He consultado en tiempo real el expediente del radicado **${caseData.radicado}** en nuestra base oficial:\n\n• **Estado actual**: ${caseData.estado.toUpperCase()}\n• **Asunto**: ${caseData.asunto}\n• **Fecha de radicación**: ${new Date(caseData.fecha_radicacion).toLocaleDateString('es-CO')}\n• **Vencimiento oficial**: ${caseData.fecha_vencimiento} (${caseData.dias_restantes} días hábiles restantes)\n${caseData.respuesta ? `• **Respuesta oficial**: ${caseData.respuesta}` : '• **Trámite**: En curso por la dependencia competente.'}\n\nPuedes revisar la bitácora completa en la **Ventanilla PQRSD** del menú.`

          reactiveBotMsg.content = respText
          reactiveBotMsg.emotion = 'empatia'
          reactiveBotMsg.sources = [
            {
              lawName: 'Expediente PQRSD',
              articleNumber: caseData.radicado,
              excerpt: `Vencimiento legal: ${caseData.fecha_vencimiento} · Estado: ${caseData.estado}`,
            },
          ]
          reactiveBotMsg.responseTimeMs = Math.round(performance.now() - startMs)
          liveSubtitle.value = respText
          speakWithLipSync(respText, 'empatia')
          return
        }
      } catch {
        // Continuar si falla la conexión
      }
    }

    // 1. Consumo directo del backend FastAPI (/api/v1/ask) solo si está habilitado
    if (isBackendEnabled) {
      try {
        const response = await fetch('/api/v1/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: content.trim(),
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data && data.answer) {
            reactiveBotMsg.content = data.answer
            reactiveBotMsg.sources = normalizeRagSources(data.sources)
            reactiveBotMsg.responseTimeMs = Math.round(performance.now() - startMs)
            liveSubtitle.value = reactiveBotMsg.content

            statsStore.logQuery({
              question: content,
              responseMs: reactiveBotMsg.responseTimeMs,
              origin: 'backend',
              mode,
              laws: (reactiveBotMsg.sources ?? []).map((s) => s.lawName),
            })

            speakWithLipSync(reactiveBotMsg.content, 'empatia')
            return
          }
        }
      } catch {
        // Respaldo local autónomo si el backend falla
      }
    }

    if (!reactiveBotMsg.content.trim()) {
      // Motor Autónomo TransLogix Colombia (Sin requerir backend)
      const localResp = generateTranslogixResponse(content)
      reactiveBotMsg.sources = localResp.sources ?? []
      reactiveBotMsg.emotion = localResp.emotion
      reactiveBotMsg.responseTimeMs = Math.max(120, Math.round(performance.now() - startMs))
      reactiveBotMsg.content = localResp.content
      liveSubtitle.value = localResp.content

      statsStore.logQuery({
        question: content,
        responseMs: reactiveBotMsg.responseTimeMs,
        origin: 'local',
        mode,
        laws: (reactiveBotMsg.sources ?? []).map((s) => s.lawName),
      })

      speakWithLipSync(reactiveBotMsg.content, localResp.emotion)
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
    startNewInstance,
    selectConversation,
    sendUserMessage,
    speakWithLipSync,
    stopSpeaking,
    testSelectedVoice,
  }
})
