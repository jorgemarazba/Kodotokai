<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Scale,
  MessageSquarePlus,
  Briefcase,
  MessageSquare,
  UserPlus,
  Settings,
  ChevronDown,
  Volume2,
} from 'lucide-vue-next'
import { useSessionStore } from '@/stores/session'
import { useLawyersStore } from '@/stores/lawyers'
import { useChatStore } from '@/stores/chat'

const router = useRouter()
const route = useRoute()
const sessionStore = useSessionStore()
const lawyersStore = useLawyersStore()
const chatStore = useChatStore()

const showSettings = ref(false)

function handleVoiceChange(event: Event) {
  chatStore.applyVoiceProfile?.((event.target as HTMLSelectElement).value)
}

function handlePitchChange() {
  chatStore.testSelectedVoice?.()
}

function handleNewChat() {
  chatStore.startNewChat()
  router.push('/')
}

function openConversation(id: string) {
  chatStore.selectConversation(id)
  router.push('/')
}
</script>

<template>
  <aside class="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none shrink-0">
    <!-- Logo Superior -->
    <div class="p-4 border-b border-slate-800 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
        <Scale class="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 class="font-bold text-base text-white tracking-tight">Remi-915 Colombia</h1>
        <p class="text-xs text-slate-400">IA Local</p>
      </div>
    </div>

    <!-- Navegación Principal (Orden exacto: Nuevo chat -> Lawyers) -->
    <div class="p-3 space-y-1.5">
      <!-- 1. Nuevo chat -->
      <button
        @click="handleNewChat"
        class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer"
        :class="
          route.path === '/'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
            : 'text-slate-300 hover:bg-slate-800'
        "
      >
        <MessageSquarePlus class="w-4 h-4" />
        <span>Nuevo chat</span>
      </button>

      <!-- 2. Lawyers (Debajo de Nuevo chat) -->
      <button
        @click="router.push('/lawyers')"
        class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer"
        :class="
          route.path === '/lawyers'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
            : 'text-slate-300 hover:bg-slate-800'
        "
      >
        <span class="flex items-center gap-3">
          <Briefcase class="w-4 h-4" />
          <span>Lawyers</span>
        </span>
        <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-blue-300 border border-slate-700">
          {{ lawyersStore.lawyers.length }}
        </span>
      </button>
    </div>

    <!-- Historial de conversaciones -->
    <div class="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      Historial
    </div>
    <div class="flex-1 overflow-y-auto px-3 space-y-1">
      <div
        v-if="chatStore.userConversations.length === 0"
        class="text-xs text-slate-500 px-2 py-4 text-center"
      >
        Tus consultas aparecerán aquí.
      </div>
      <button
        v-for="conv in chatStore.userConversations"
        :key="conv.id"
        @click="openConversation(conv.id)"
        class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition cursor-pointer truncate"
        :class="
          conv.id === chatStore.activeConversationId && route.path === '/'
            ? 'bg-slate-800 text-white font-medium'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
        "
      >
        <MessageSquare class="w-3.5 h-3.5 shrink-0 text-blue-400" />
        <span class="truncate">{{ conv.title }}</span>
      </button>
    </div>

    <!-- Botón Registro de Servicio -->
    <div class="p-3 border-t border-slate-800 space-y-2.5 bg-slate-950/50">
      <button
        @click="sessionStore.openEntryTab('service-register')"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
      >
        <UserPlus class="w-3.5 h-3.5" />
        <span>Registro de servicio (Abogados)</span>
      </button>

      <div v-if="showSettings" class="space-y-2 text-[11px] text-slate-300">
        <div class="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
          <Volume2 class="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span class="text-slate-400">Voz:</span>
          <select
            :value="chatStore.selectedVoiceId"
            @change="handleVoiceChange"
            class="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer w-full min-w-0 truncate"
          >
            <option
              v-for="v in chatStore.availableVoices"
              :key="v.id"
              :value="v.id"
              class="bg-slate-900 text-slate-200"
            >
              {{ v.label }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
          <span class="text-slate-400">Timbre:</span>
          <select
            v-model.number="chatStore.voicePitch"
            @change="handlePitchChange"
            class="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer w-full min-w-0"
          >
            <option :value="0.76" class="bg-slate-900">Masculino Muy Grave</option>
            <option :value="0.86" class="bg-slate-900">Masculino Grave</option>
            <option :value="0.92" class="bg-slate-900">Masculino Natural</option>
            <option :value="1.0" class="bg-slate-900">Estándar</option>
          </select>
        </div>
      </div>

      <!-- Configuración: Voz y Timbre del avatar -->
      <button
        @click="showSettings = !showSettings"
        class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
      >
        <span class="flex items-center gap-2">
          <Settings class="w-3.5 h-3.5" />
          <span>Configuración</span>
        </span>
        <ChevronDown class="w-3.5 h-3.5 transition" :class="showSettings ? 'rotate-180' : ''" />
      </button>
    </div>
  </aside>
</template>