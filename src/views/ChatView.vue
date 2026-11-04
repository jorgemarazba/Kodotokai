<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Mic,
  MicOff,
  Send,
  VolumeX,
  Volume2,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  X,
  Trash2,
  AlertCircle,
  Sparkles,
  HelpCircle,
} from 'lucide-vue-next'
import AvatarCanvas from '@/components/avatar/AvatarCanvas.vue'
import { useChatStore } from '@/stores/chat'
import { useSessionStore } from '@/stores/session'
import { useStatsStore } from '@/stores/stats'

const chatStore = useChatStore()
const sessionStore = useSessionStore()
const statsStore = useStatsStore()

const inputMessage = ref('')
const isRecording = ref(false)
const recordingDuration = ref(0)
const micErrorMessage = ref<string | null>(null)
const isCloudSpeechBlocked = ref(false)
const hasSpeechActivity = ref(false)
const audioLevels = ref([8, 12, 16, 12, 8])

let mediaStream: MediaStream | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let animationFrameId: number | null = null

let recognition: any = null
let silenceTimer: ReturnType<typeof setTimeout> | null = null
let recordingTimer: ReturnType<typeof setInterval> | null = null
let manualStop = false

const quickVoicePrompts = [
  '¿Cómo cotizo un envío de mercancía en TransLogix?',
  '¿Cuáles son las tarifas y rutas principales?',
  '¿Qué requisitos hay para transportar mercancías peligrosas?',
  '¿Cómo radicar o consultar el estado de un PQRS?',
]

const formattedDuration = computed(() => {
  const mins = Math.floor(recordingDuration.value / 60)
  const secs = recordingDuration.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const backendStatusLabel = computed(() => {
  if (chatStore.backendStatus === 'online') return 'Backend en línea'
  if (chatStore.backendStatus === 'offline') return 'Backend sin conexión'
  return 'Verificando backend'
})

const backendStatusColor = computed(() => {
  if (chatStore.backendStatus === 'online') return 'text-emerald-400'
  if (chatStore.backendStatus === 'offline') return 'text-red-400'
  return 'text-slate-500'
})

onMounted(() => {
  chatStore.loadSpanishVoices?.()
  chatStore.playWelcomeGreeting()
  void chatStore.checkBackendHealth()
})

onBeforeUnmount(() => {
  stopAudioAnalyser()
  clearRecordingTimer()
  clearSilenceTimer()
})

function clearSilenceTimer() {
  if (silenceTimer) {
    clearTimeout(silenceTimer)
    silenceTimer = null
  }
}

function clearRecordingTimer() {
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
}

let recordedSamples: Float32Array[] = []
let processorNode: ScriptProcessorNode | null = null

function encodeWAV(sampleChunks: Float32Array[], sampleRate: number): Blob {
  let totalLength = 0
  for (const c of sampleChunks) {
    totalLength += c.length
  }
  const merged = new Float32Array(totalLength)
  let offset = 0
  for (const c of sampleChunks) {
    merged.set(c, offset)
    offset += c.length
  }

  const buffer = new ArrayBuffer(44 + merged.length * 2)
  const view = new DataView(buffer)
  const writeString = (o: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(o + i, str.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + merged.length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, merged.length * 2, true)

  let pcmOffset = 44
  for (let i = 0; i < merged.length; i++) {
    const s = Math.max(-1, Math.min(1, merged[i]!))
    view.setInt16(pcmOffset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    pcmOffset += 2
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

function setupAudioAnalyser(stream: MediaStream) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    audioContext = new AudioCtx({ sampleRate: 16000 })
    const source = audioContext.createMediaStreamSource(stream)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.6
    source.connect(analyser)

    // ScriptProcessor para recolectar samples PCM en memoria
    processorNode = audioContext.createScriptProcessor(4096, 1, 1)
    recordedSamples = []
    processorNode.onaudioprocess = (e) => {
      if (!isRecording.value) return
      const inputData = e.inputBuffer.getChannelData(0)
      recordedSamples.push(new Float32Array(inputData))
    }
    source.connect(processorNode)
    processorNode.connect(audioContext.destination)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const updateAudio = () => {
      if (!isRecording.value || !analyser) return
      analyser.getByteFrequencyData(dataArray)

      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]!
      }
      const avg = sum / dataArray.length
      if (avg > 10) {
        hasSpeechActivity.value = true
      }

      audioLevels.value = [
        Math.max(4, Math.min(26, ((dataArray[1] || 0) / 255) * 26 + 4)),
        Math.max(6, Math.min(28, ((dataArray[4] || 0) / 255) * 28 + 6)),
        Math.max(8, Math.min(30, ((dataArray[8] || 0) / 255) * 30 + 8)),
        Math.max(6, Math.min(28, ((dataArray[12] || 0) / 255) * 28 + 6)),
        Math.max(4, Math.min(26, ((dataArray[16] || 0) / 255) * 26 + 4)),
      ]

      animationFrameId = requestAnimationFrame(updateAudio)
    }
    updateAudio()
  } catch (err) {
    console.warn('AudioAnalyser no disponible:', err)
  }
}

function stopAudioAnalyser() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (processorNode) {
    try {
      processorNode.disconnect()
    } catch {
      // ignorar
    }
    processorNode = null
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
  if (audioContext) {
    try {
      audioContext.close()
    } catch {
      // ignorar
    }
    audioContext = null
  }
  analyser = null
  audioLevels.value = [8, 12, 16, 12, 8]
}

function selectQuickPrompt(promptText: string) {
  inputMessage.value = promptText
  if (isRecording.value) {
    stopVoiceRecording(false)
  }
  handleSend('voice')
}

async function startVoiceRecording() {
  micErrorMessage.value = null
  isCloudSpeechBlocked.value = false
  hasSpeechActivity.value = false

  // Silenciar Remi si está hablando para no interferir
  if (chatStore.avatarState === 'speaking') {
    chatStore.stopSpeaking()
  }

  // 1. Conexión de micrófono real de hardware con getUserMedia
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      setupAudioAnalyser(mediaStream)
    }
  } catch (micErr: any) {
    console.warn('Permiso de micrófono denegado:', micErr)
    micErrorMessage.value =
      'Permiso de micrófono denegado en tu navegador. Haz clic en el icono de candado o configuración junto a la URL para permitir el micrófono.'
    return
  }

  manualStop = false
  isRecording.value = true
  recordingDuration.value = 0
  chatStore.avatarState = 'listening'
  chatStore.liveSubtitle = '🎙️ Remi escuchando: habla ahora...'

  clearRecordingTimer()
  recordingTimer = setInterval(() => {
    recordingDuration.value++
  }, 1000)

  // 2. Reconocimiento de voz nativo en paralelo
  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  if (!SpeechRecognitionAPI) {
    isCloudSpeechBlocked.value = true
    return
  }

  if (recognition) {
    try {
      recognition.abort()
    } catch {
      // ignorar
    }
    recognition = null
  }

  try {
    recognition = new SpeechRecognitionAPI()
    const browserLang = (navigator.language || 'es-ES').toLowerCase()
    recognition.lang = browserLang.startsWith('es') ? browserLang : 'es-ES'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let fullTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript
      }

      const cleanText = fullTranscript.trim()
      if (cleanText) {
        inputMessage.value = cleanText
        chatStore.liveSubtitle = `🎤 "${cleanText}"`
        hasSpeechActivity.value = true
      }

      clearSilenceTimer()
      if (cleanText.length > 5) {
        silenceTimer = setTimeout(() => {
          if (isRecording.value && !manualStop && inputMessage.value.trim()) {
            stopVoiceRecording(true)
          }
        }, 3500)
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return
      }

      console.warn('SpeechRecognition event error:', event.error)

      if (event.error === 'network') {
        // En Brave Browser o redes con restricción a Google Speech:
        // NO cerramos el micrófono. Mantenemos el micrófono físico activo y las ondas reactivas.
        isCloudSpeechBlocked.value = true
        chatStore.liveSubtitle = '🎙️ Micrófono activo · Te escucho en vivo...'
        return
      }

      if (event.error === 'not-allowed') {
        stopVoiceRecording(false)
        micErrorMessage.value =
          'Permiso de micrófono denegado. Haz clic en el candado junto a la URL y permite el micrófono.'
        return
      }
    }

    recognition.onend = () => {
      if (isRecording.value && !manualStop && !isCloudSpeechBlocked.value) {
        try {
          recognition.start()
        } catch {
          // continuar
        }
      }
    }

    recognition.start()
  } catch (err: any) {
    console.warn('Error al inicializar SpeechRecognition:', err)
    isCloudSpeechBlocked.value = true
  }
}

async function stopVoiceRecording(shouldSend = true) {
  manualStop = true
  clearSilenceTimer()
  clearRecordingTimer()
  isRecording.value = false

  const currentSampleRate = audioContext?.sampleRate || 16000
  const localChunks = [...recordedSamples]
  stopAudioAnalyser()

  if (recognition) {
    try {
      recognition.stop()
    } catch {
      // ignorar
    }
  }

  let text = inputMessage.value.trim()

  // Si el navegador no transcribió texto (ej: Brave), transcribimos el audio capturado con el backend
  if (!text && shouldSend && (hasSpeechActivity.value || localChunks.length > 8)) {
    chatStore.avatarState = 'thinking'
    chatStore.liveSubtitle = '🎙️ Transcribiendo tu voz con precisión...'
    try {
      const wavBlob = encodeWAV(localChunks, currentSampleRate)
      const formData = new FormData()
      formData.append('file', wavBlob, 'recording.wav')

      const res = await fetch('/api/v1/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.text) {
          text = data.text.trim()
          inputMessage.value = text
        }
      }
    } catch (err) {
      console.warn('Error en transcripción backend:', err)
    }
  }

  if (shouldSend && text) {
    handleSend('voice')
  } else {
    chatStore.avatarState = 'idle'
  }
}

function cancelVoiceRecording() {
  inputMessage.value = ''
  stopVoiceRecording(false)
}

function toggleVoiceRecording() {
  if (isRecording.value) {
    stopVoiceRecording(true)
  } else {
    startVoiceRecording()
  }
}

async function handleSend(mode: 'text' | 'voice' = 'text') {
  const text = inputMessage.value.trim()
  if (!text) return
  inputMessage.value = ''
  if (isRecording.value) {
    stopVoiceRecording(false)
  }
  await chatStore.sendUserMessage(text, mode)
}

onBeforeUnmount(() => {
  manualStop = true
  clearSilenceTimer()
  clearRecordingTimer()
  if (recognition) {
    try {
      recognition.stop()
    } catch {
      // ignorar
    }
  }
})
</script>

<template>
  <div class="flex h-full bg-slate-950">
    <!-- Columna Izquierda: Chat y Barra Adaptada -->
    <div
      class="flex flex-col flex-1 min-w-0 h-full relative"
      style="background-color: #030f0c; background-image: url('/translogix-routes-bg.svg'); background-size: cover; background-position: center;"
    >
      <!-- Panel de Avatar en Móvil (< lg) cuando se activa el botón Ver Avatar -->
      <div
        v-if="sessionStore.showMobileAvatar"
        class="lg:hidden border-b border-slate-800 bg-slate-900/95 p-2 sm:p-3 flex flex-col items-center justify-center relative shrink-0 z-20 shadow-lg"
      >
        <button
          @click="sessionStore.showMobileAvatar = false"
          class="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition text-xs flex items-center gap-1 cursor-pointer"
        >
          <X class="w-3.5 h-3.5" />
          <span class="text-[11px]">Cerrar</span>
        </button>
        <div class="scale-90 sm:scale-100 transform origin-center max-w-full overflow-hidden">
          <AvatarCanvas />
        </div>
        <!-- Subtítulo breve en móvil -->
        <p
          v-if="chatStore.avatarState === 'speaking' || chatStore.avatarState === 'listening'"
          class="mt-1 text-xs text-center text-slate-300 italic px-3 max-w-md truncate"
        >
          {{ chatStore.avatarState === 'listening' ? `🎤 ${inputMessage || 'Escuchando tu voz...'}` : chatStore.liveSubtitle }}
        </p>
      </div>

      <!-- Zona Central: Historial de Mensajes de la Conversación Activa -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 max-w-6xl w-full mx-auto">
        <div
          v-for="msg in chatStore.activeConversation?.messages || []"
          :key="msg.id"
          class="flex flex-col"
          :class="msg.sender === 'USER' ? 'items-end' : 'items-start'"
        >
          <div
            class="rounded-2xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed"
            :class="
              msg.sender === 'USER'
                ? 'max-w-2xl sm:max-w-3xl bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-600/30'
                : msg.error
                  ? 'max-w-3xl sm:max-w-4xl xl:max-w-5xl bg-red-950/40 border border-red-500/50 text-red-100 rounded-bl-none shadow-xl backdrop-blur-md'
                  : 'max-w-3xl sm:max-w-4xl xl:max-w-5xl bg-slate-900/90 border border-slate-800 text-slate-100 rounded-bl-none shadow-xl backdrop-blur-md'
            "
            :role="msg.error ? 'alert' : undefined"
          >
            <div v-if="msg.error" class="flex items-start gap-2">
              <AlertCircle class="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p class="whitespace-pre-line">{{ msg.content }}</p>
            </div>
            <p v-else-if="msg.content">{{ msg.content }}</p>
            <!-- Indicador "escribiendo..." mientras llega la respuesta -->
            <div v-else-if="msg.sender === 'ASSISTANT'" class="flex items-center gap-2 text-slate-400">
              <span>Remi está escribiendo</span>
              <span class="flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce"></span>
              </span>
            </div>

            <!-- Fuentes normativas o referencias -->
            <div v-if="msg.sources && msg.sources.length > 0" class="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
              <span
                v-for="(src, i) in msg.sources"
                :key="i"
                class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              >
                <BookOpen class="w-3 h-3" />
                {{ src.lawName }} ({{ src.articleNumber }})
              </span>
            </div>
          </div>
          <span class="text-[10px] text-slate-400 mt-1 px-1">
            {{ msg.sender === 'USER' ? sessionStore.user?.name || 'Tú' : 'Remi' }} · {{ msg.createdAt }}
            <template v-if="msg.responseTimeMs"> · ⚡ {{ msg.responseTimeMs }} ms</template>
          </span>
          <!-- Valoración de la respuesta (alimenta Estadísticas) -->
          <div v-if="msg.sender === 'ASSISTANT' && msg.content && !msg.error" class="flex items-center gap-1 mt-1 px-1">
            <button
              @click="statsStore.setFeedback(msg.id, 1)"
              title="Respuesta útil"
              class="p-1 rounded-md transition cursor-pointer"
              :class="statsStore.feedback[msg.id] === 1 ? 'text-emerald-400 bg-emerald-500/15' : 'text-slate-500 hover:text-slate-300'"
            >
              <ThumbsUp class="w-3.5 h-3.5" />
            </button>
            <button
              @click="statsStore.setFeedback(msg.id, -1)"
              title="Respuesta no útil"
              class="p-1 rounded-md transition cursor-pointer"
              :class="statsStore.feedback[msg.id] === -1 ? 'text-red-400 bg-red-500/15' : 'text-slate-500 hover:text-slate-300'"
            >
              <ThumbsDown class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Barra Inferior: Input Inteligente con Micrófono Adaptado -->
      <div class="p-2.5 sm:p-4 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-md shrink-0">
        <!-- Banner de Error o Aviso con Preguntas Rápidas -->
        <div
          v-if="micErrorMessage"
          class="max-w-5xl mx-auto mb-2.5 p-3 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs shadow-lg space-y-2.5"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-start gap-2 min-w-0">
              <AlertCircle class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p class="leading-relaxed">{{ micErrorMessage }}</p>
            </div>
            <button
              @click="micErrorMessage = null"
              class="text-amber-400 hover:text-white p-1 rounded-md transition cursor-pointer shrink-0"
              title="Cerrar aviso"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Píldoras de preguntas rápidas sugeridas -->
          <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-amber-500/20">
            <span class="text-[11px] text-amber-300 font-semibold mr-1 flex items-center gap-1">
              <HelpCircle class="w-3 h-3" />
              Consultar por clic:
            </span>
            <button
              v-for="(p, i) in quickVoicePrompts"
              :key="i"
              @click="selectQuickPrompt(p)"
              class="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700/80 hover:border-emerald-500 transition cursor-pointer"
            >
              {{ p }}
            </button>
          </div>
        </div>

        <!-- MODO 1: GRABANDO VOZ (Micrófono Adaptado con Analizador de Audio Real) -->
        <div
          v-if="isRecording"
          class="max-w-5xl mx-auto space-y-2 bg-gradient-to-r from-emerald-950/70 via-slate-950/95 to-teal-950/50 border border-emerald-500/50 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-emerald-950/30 transition-all duration-300"
        >
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Indicador Pulsante + Cronómetro -->
            <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 shrink-0">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span class="font-mono text-xs font-bold text-emerald-300 tracking-wider">
                {{ formattedDuration }}
              </span>
            </div>

            <!-- Ecualizador de ondas reactivas a la voz real del usuario -->
            <div class="flex items-center gap-1 h-7 px-1.5 shrink-0 bg-slate-900/80 rounded-lg border border-emerald-500/30" title="Nivel del micrófono en vivo">
              <span
                v-for="(h, idx) in audioLevels"
                :key="idx"
                class="w-1.5 rounded-full bg-gradient-to-t from-emerald-500 to-cyan-300 transition-all duration-75"
                :style="{ height: `${h}px` }"
              ></span>
            </div>

            <!-- Campo de transcripción en tiempo real / editable -->
            <div class="flex-1 min-w-0 px-1">
              <input
                v-model="inputMessage"
                @keyup.enter="stopVoiceRecording(true)"
                type="text"
                :placeholder="isCloudSpeechBlocked ? '🎙️ Micrófono en vivo capturado... habla o escribe aquí' : '🎙️ Te escucho... habla sobre tu cotización o envío'"
                class="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
              />
            </div>

            <!-- Botones de Acción: Descartar y Enviar Audio -->
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click="cancelVoiceRecording"
                title="Cancelar grabación"
                class="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-red-950/80 text-slate-300 hover:text-red-300 border border-slate-700/80 hover:border-red-500/50 text-xs font-medium transition cursor-pointer"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">Descartar</span>
              </button>

              <button
                @click="stopVoiceRecording(true)"
                title="Enviar consulta por voz"
                class="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                <Send class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">Enviar</span>
              </button>
            </div>
          </div>

          <!-- Sugerencias rápidas por voz integradas -->
          <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-emerald-500/20 text-xs">
            <span class="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles class="w-3 h-3 text-emerald-400" />
              <span>Consultas rápidas por voz:</span>
            </span>
            <button
              v-for="(p, i) in quickVoicePrompts"
              :key="i"
              @click="selectQuickPrompt(p)"
              class="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700/70 hover:border-emerald-500 transition cursor-pointer"
            >
              {{ p }}
            </button>
          </div>
        </div>

        <!-- MODO 2: ENTRADA ESTÁNDAR (Input con Micrófono Adaptado) -->
        <div v-else class="max-w-5xl mx-auto flex items-center gap-2 sm:gap-2.5">
          <!-- Silenciar voz de Remi si está hablando -->
          <button
            v-if="chatStore.avatarState === 'speaking'"
            @click="chatStore.stopSpeaking()"
            title="Silenciar voz del avatar"
            class="p-2.5 sm:p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition cursor-pointer shrink-0 shadow-md flex items-center gap-1.5 text-xs font-medium animate-pulse"
          >
            <VolumeX class="w-4 h-4" />
            <span class="hidden md:inline">Silenciar</span>
          </button>

          <!-- Input con Micrófono integrado -->
          <div class="relative flex-1 flex items-center">
            <input
              v-model="inputMessage"
              @keyup.enter="handleSend('text')"
              type="text"
              placeholder="Escribe tu consulta o haz clic en el micrófono para hablar con Remi..."
              class="w-full rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 px-3.5 sm:px-4 py-2.5 sm:py-3 pr-11 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />

            <!-- Botón de Micrófono integrado a la derecha del input -->
            <button
              @click="startVoiceRecording"
              type="button"
              title="Hablar por micrófono con Remi"
              class="absolute right-2 p-1.5 sm:p-2 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-600/30 active:scale-95 transition cursor-pointer flex items-center justify-center group"
            >
              <Mic class="w-4 h-4 group-hover:scale-110 transition-transform text-emerald-400 group-hover:text-emerald-300" />
            </button>
          </div>

          <!-- Botón Enviar texto -->
          <button
            @click="handleSend('text')"
            :disabled="!inputMessage.trim()"
            class="px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-md shadow-emerald-600/25 active:scale-98"
          >
            <Send class="w-4 h-4" />
            <span class="hidden sm:inline">Enviar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Columna Derecha: Avatar 3D + Subtítulos y Estado en Vivo -->
    <div
      class="hidden lg:flex w-80 xl:w-96 shrink-0 border-l border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 flex-col justify-between overflow-y-auto"
    >
      <div class="w-full flex-1 flex flex-col items-center justify-center">
        <AvatarCanvas />
      </div>

      <!-- Tarjeta Dinámica de Subtítulos y Estado de Voz -->
      <div class="w-full mt-3 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 shadow-xl backdrop-blur-md">
        <!-- Estado: Escuchando micrófono -->
        <div v-if="chatStore.avatarState === 'listening'" class="space-y-1.5">
          <div class="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Mic class="w-3.5 h-3.5" />
            <span>Remi escuchando tu voz</span>
          </div>
          <p class="text-xs text-slate-200 leading-relaxed italic line-clamp-3">
            {{ inputMessage ? `"${inputMessage}"` : 'Habla ahora con naturalidad...' }}
          </p>
        </div>

        <!-- Estado: Remi hablando / explicando -->
        <div v-else-if="chatStore.avatarState === 'speaking'" class="space-y-1.5">
          <div class="flex items-center gap-2 text-blue-400 text-xs font-semibold">
            <Volume2 class="w-3.5 h-3.5 animate-pulse" />
            <span>Remi respondiendo</span>
          </div>
          <p class="text-xs text-slate-200 leading-relaxed line-clamp-4">
            {{ chatStore.liveSubtitle || 'Explicando tu cotización...' }}
          </p>
        </div>

        <!-- Estado: Remi procesando / cotizando -->
        <div v-else-if="chatStore.avatarState === 'thinking'" class="space-y-1.5">
          <div class="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <Sparkles class="w-3.5 h-3.5 animate-spin" />
            <span>Remi cotizando y analizando</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Consultando normatividad, rutas y tarifas de transporte...
          </p>
        </div>

        <!-- Estado: En reposo (Listo) -->
        <div v-else class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Remi · Asistente Logístico
            </span>
            <span class="text-[10px]" :class="backendStatusColor">{{ backendStatusLabel }}</span>
          </div>
          <p class="text-[11px] text-slate-400 leading-snug">
            Puedes escribir tu consulta o pulsar el micrófono <span class="text-emerald-400 font-semibold">🎙️</span> para hablar en cualquier momento.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
