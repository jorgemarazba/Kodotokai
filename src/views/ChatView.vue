<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Mic, MicOff, Send, VolumeX, BookOpen, ThumbsUp, ThumbsDown, X } from 'lucide-vue-next'
import AvatarCanvas from '@/components/avatar/AvatarCanvas.vue'
import { useChatStore } from '@/stores/chat'
import { useSessionStore } from '@/stores/session'
import { useStatsStore } from '@/stores/stats'

const chatStore = useChatStore()
const sessionStore = useSessionStore()
const statsStore = useStatsStore()

const inputMessage = ref('')
const isRecording = ref(false)
let recognition: any = null
let silenceTimer: ReturnType<typeof setTimeout> | null = null
let manualStop = false

onMounted(() => {
  chatStore.loadSpanishVoices?.()
  chatStore.playWelcomeGreeting()
})

function clearSilenceTimer() {
  if (silenceTimer) {
    clearTimeout(silenceTimer)
    silenceTimer = null
  }
}

async function toggleVoiceRecording() {
  if (isRecording.value) {
    stopVoiceRecording(true)
    return
  }

  if (chatStore.avatarState === 'speaking') {
    chatStore.stopSpeaking()
  }

  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  if (!SpeechRecognitionAPI) {
    chatStore.liveSubtitle =
      '⚠️ Tu navegador no soporta reconocimiento de voz (usa Google Chrome o Microsoft Edge).'
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
  } catch {
    chatStore.liveSubtitle =
      '⚠️ Permiso de micrófono denegado. Haz clic en el icono junto a la URL y permite el micrófono.'
    return
  }

  manualStop = false
  recognition = new SpeechRecognitionAPI()
  recognition.lang = 'es-CO'
  recognition.continuous = true
  recognition.interimResults = true

  recognition.onstart = () => {
    isRecording.value = true
    chatStore.avatarState = 'listening'
    chatStore.liveSubtitle = '🎙️ Micrófono activo: habla ahora (pulsa de nuevo para enviar)...'
  }

  recognition.onresult = (event: any) => {
    let transcript = ''
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript
    }
    inputMessage.value = transcript
    chatStore.liveSubtitle = `🎤 "${transcript}"`

    clearSilenceTimer()
    if (transcript.trim().length > 2) {
      silenceTimer = setTimeout(() => {
        if (isRecording.value && inputMessage.value.trim()) {
          stopVoiceRecording(true)
        }
      }, 2400)
    }
  }

  recognition.onerror = (event: any) => {
    if (event.error === 'no-speech' && !manualStop) {
      return
    }
    clearSilenceTimer()
    isRecording.value = false
    chatStore.avatarState = 'idle'
  }

  recognition.onend = () => {
    if (isRecording.value && !manualStop && !inputMessage.value.trim()) {
      try {
        recognition.start()
        return
      } catch {
        // continuar
      }
    }

    clearSilenceTimer()
    isRecording.value = false
    if (inputMessage.value.trim()) {
      handleSend('voice')
    } else {
      chatStore.avatarState = 'idle'
    }
  }

  try {
    recognition.start()
  } catch {
    isRecording.value = false
    chatStore.avatarState = 'idle'
  }
}

function stopVoiceRecording(shouldSend = true) {
  manualStop = true
  clearSilenceTimer()
  isRecording.value = false
  if (recognition) {
    try {
      recognition.stop()
    } catch {
      // ignorar
    }
  }
  if (shouldSend && inputMessage.value.trim()) {
    handleSend('voice')
  } else if (!inputMessage.value.trim()) {
    chatStore.avatarState = 'idle'
  }
}

async function handleSend(mode: 'text' | 'voice' = 'text') {
  const text = inputMessage.value.trim()
  if (!text) return
  inputMessage.value = ''
  await chatStore.sendUserMessage(text, mode)
}

onBeforeUnmount(() => {
  manualStop = true
  clearSilenceTimer()
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
    <!-- Columna Izquierda: solo el chat -->
    <div class="flex flex-col flex-1 min-w-0 h-full relative" style="background-color: #020617; background-image: url('/dark-marble-bg.svg'); background-size: cover; background-position: center;">
      <!-- Panel de Avatar en Móvil (< lg) cuando se activa el botón Ver Avatar -->
      <div
        v-if="sessionStore.showMobileAvatar"
        class="lg:hidden border-b border-slate-800 bg-slate-900/90 p-2 sm:p-3 flex flex-col items-center justify-center relative shrink-0 z-20 shadow-lg"
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
              : 'max-w-3xl sm:max-w-4xl xl:max-w-5xl bg-slate-900/90 border border-slate-800 text-slate-100 rounded-bl-none shadow-xl backdrop-blur-md'
          "
        >
          <p v-if="msg.content">{{ msg.content }}</p>
          <!-- Indicador "escribiendo..." mientras llega la respuesta -->
          <div v-else-if="msg.sender === 'ASSISTANT'" class="flex items-center gap-2 text-slate-400">
            <span>Remi está escribiendo</span>
            <span class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]"></span>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]"></span>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce"></span>
            </span>
          </div>

          <!-- Artículos legales citados por el RAG -->
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
        <div v-if="msg.sender === 'ASSISTANT' && msg.content" class="flex items-center gap-1 mt-1 px-1">
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

    <!-- Barra Inferior: Botón de Micrófono por Voz + Input de Texto -->
    <div class="p-2 sm:p-4 border-t border-slate-800/80 bg-slate-900/80 backdrop-blur-md shrink-0">
      <div class="max-w-6xl mx-auto flex items-center gap-1.5 sm:gap-2.5">
        <button
          @click="toggleVoiceRecording"
          class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition cursor-pointer shrink-0"
          :class="
            isRecording
              ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
          "
        >
          <MicOff v-if="isRecording" class="w-4 h-4" />
          <Mic v-else class="w-4 h-4" />
          <span class="hidden sm:inline">{{ isRecording ? 'Detener y enviar' : 'Hablar con Avatar' }}</span>
          <span class="inline sm:hidden">{{ isRecording ? 'Detener' : 'Voz' }}</span>
        </button>

        <button
          v-if="chatStore.avatarState === 'speaking'"
          @click="chatStore.stopSpeaking()"
          title="Silenciar voz del avatar"
          class="p-2.5 sm:p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer shrink-0"
        >
          <VolumeX class="w-4 h-4" />
        </button>

        <input
          v-model="inputMessage"
          @keyup.enter="handleSend()"
          type="text"
          placeholder="Escribe tu consulta sobre transporte, cotizaciones o envíos..."
          class="flex-1 min-w-0 rounded-xl bg-slate-950/90 border border-slate-800 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white focus:border-emerald-500 focus:outline-none"
        />

        <button
          @click="handleSend()"
          class="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-md shadow-emerald-600/25"
        >
          <Send class="w-4 h-4" />
          <span class="hidden sm:inline">Enviar</span>
        </button>
      </div>
    </div>
    </div>
    <!-- Columna Derecha: Avatar 3D + Subtítulos en Vivo -->
    <div class="hidden lg:flex w-80 xl:w-96 shrink-0 border-l border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 flex-col items-center justify-center overflow-hidden">
      <div class="w-full">
        <AvatarCanvas />
      </div>



    </div>

  </div>
</template>
