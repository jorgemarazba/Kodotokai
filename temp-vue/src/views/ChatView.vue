<script setup lang="ts">
import { ref } from 'vue'
import { Mic, MicOff, Send, VolumeX, BookOpen } from 'lucide-vue-next'
import AvatarCanvas from '@/components/avatar/AvatarCanvas.vue'
import { useChatStore } from '@/stores/chat'
import { useSessionStore } from '@/stores/session'

const chatStore = useChatStore()
const sessionStore = useSessionStore()

const inputMessage = ref('')
const isRecording = ref(false)
let recognition: any = null

function toggleVoiceRecording() {
  if (isRecording.value) {
    stopVoiceRecording()
    return
  }

  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  if (!SpeechRecognitionAPI) {
    alert('Tu navegador no soporta reconocimiento de voz directo. Escribe tu consulta en el cuadro inferior.')
    return
  }

  recognition = new SpeechRecognitionAPI()
  recognition.lang = 'es-CO'
  recognition.continuous = false
  recognition.interimResults = true

  recognition.onstart = () => {
    isRecording.value = true
    chatStore.avatarState = 'listening'
    chatStore.liveSubtitle = 'Te escucho... habla ahora.'
  }

  recognition.onresult = (event: any) => {
    let transcript = ''
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript
    }
    inputMessage.value = transcript
    chatStore.liveSubtitle = `🎤 "${transcript}"`
  }

  recognition.onend = () => {
    isRecording.value = false
    if (inputMessage.value.trim()) {
      handleSend()
    } else {
      chatStore.avatarState = 'idle'
    }
  }

  recognition.onerror = () => {
    isRecording.value = false
    chatStore.avatarState = 'idle'
  }

  recognition.start()
}

function stopVoiceRecording() {
  if (recognition) {
    recognition.stop()
  }
  isRecording.value = false
}

async function handleSend() {
  const text = inputMessage.value.trim()
  if (!text) return
  inputMessage.value = ''
  await chatStore.sendUserMessage(text)
}
</script>

<template>
  <div class="flex flex-col h-full bg-slate-950">
    <!-- Zona Superior: Avatar 3D + Subtítulos en Vivo -->
    <div class="border-b border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 flex flex-col items-center">
      <div class="w-full max-w-xl">
        <AvatarCanvas />
      </div>

      <!-- Subtítulos sincronizados -->
      <div class="mt-2 max-w-2xl w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-center shadow-inner">
        <p class="text-xs sm:text-sm text-slate-200 leading-relaxed">
          {{ chatStore.liveSubtitle }}
        </p>
      </div>
    </div>

    <!-- Zona Central: Historial de Mensajes de la Conversación Activa -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3 max-w-4xl w-full mx-auto">
      <div
        v-for="msg in chatStore.activeConversation?.messages || []"
        :key="msg.id"
        class="flex flex-col"
        :class="msg.sender === 'USER' ? 'items-end' : 'items-start'"
      >
        <div
          class="max-w-2xl rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed"
          :class="
            msg.sender === 'USER'
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
          "
        >
          <p>{{ msg.content }}</p>

          <!-- Artículos legales citados por el RAG -->
          <div v-if="msg.sources && msg.sources.length > 0" class="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
            <span
              v-for="(src, i) in msg.sources"
              :key="i"
              class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30"
            >
              <BookOpen class="w-3 h-3" />
              {{ src.lawName }} ({{ src.articleNumber }})
            </span>
          </div>
        </div>
        <span class="text-[10px] text-slate-500 mt-1 px-1">
          {{ msg.sender === 'USER' ? sessionStore.user?.name || 'Tú' : 'LegalBot' }} · {{ msg.createdAt }}
          <template v-if="msg.responseTimeMs"> · ⚡ {{ msg.responseTimeMs }} ms</template>
        </span>
      </div>
    </div>

    <!-- Barra Inferior: Botón de Micrófono por Voz + Input de Texto -->
    <div class="p-4 border-t border-slate-800 bg-slate-900/60">
      <div class="max-w-4xl mx-auto flex items-center gap-2.5">
        <button
          @click="toggleVoiceRecording"
          class="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition cursor-pointer shrink-0"
          :class="
            isRecording
              ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
          "
        >
          <MicOff v-if="isRecording" class="w-4 h-4" />
          <Mic v-else class="w-4 h-4" />
          <span>{{ isRecording ? 'Detener voz' : 'Hablar con Avatar' }}</span>
        </button>

        <button
          v-if="chatStore.avatarState === 'speaking'"
          @click="chatStore.stopSpeaking()"
          title="Silenciar voz del avatar"
          class="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
        >
          <VolumeX class="w-4 h-4" />
        </button>

        <input
          v-model="inputMessage"
          @keyup.enter="handleSend"
          type="text"
          placeholder="Escribe o usa el micrófono (ej. 'Me despidieron sin justa causa' o 'Mi vecino hace mucho ruido')..."
          class="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-xs sm:text-sm text-white focus:border-blue-500 focus:outline-none"
        />

        <button
          @click="handleSend"
          class="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
        >
          <Send class="w-4 h-4" />
          <span class="hidden sm:inline">Enviar</span>
        </button>
      </div>
    </div>
  </div>
</template>