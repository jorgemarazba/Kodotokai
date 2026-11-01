<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import {
  Scale,
  MessageSquarePlus,
  Briefcase,
  ShieldAlert,
  MessageSquare,
  MapPin,
  UserPlus,
  LogOut,
} from 'lucide-vue-next'
import { useSessionStore } from '@/stores/session'
import { useLawyersStore } from '@/stores/lawyers'
import { useChatStore } from '@/stores/chat'

const router = useRouter()
const route = useRoute()
const sessionStore = useSessionStore()
const lawyersStore = useLawyersStore()
const chatStore = useChatStore()

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
        <h1 class="font-bold text-base text-white tracking-tight">LegalBot Colombia</h1>
        <p class="text-xs text-slate-400">IA Local · Sesión Vectorial</p>
      </div>
    </div>

    <!-- Navegación Principal (Orden exacto: Nuevo chat -> Lawyers -> Multiservice) -->
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

      <!-- 3. Multiservice (Debajo de Lawyers: CAI e Inspector de Policía por ciudad) -->
      <button
        @click="router.push('/multiservice')"
        class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer"
        :class="
          route.path === '/multiservice'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
            : 'text-slate-300 hover:bg-slate-800'
        "
      >
        <span class="flex items-center gap-3">
          <ShieldAlert class="w-4 h-4" />
          <span>Multiservice</span>
        </span>
        <span class="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          CAI · Insp.
        </span>
      </button>
    </div>

    <!-- Historial Privado del Usuario Activo -->
    <div class="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      Historial de tu instancia
    </div>
    <div class="flex-1 overflow-y-auto px-3 space-y-1">
      <div
        v-if="chatStore.userConversations.length === 0"
        class="text-xs text-slate-500 px-2 py-4 text-center"
      >
        Tus consultas privadas aparecerán aquí.
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

    <!-- Selector de Ciudad + Usuario Activo + Botón Registro de Servicio -->
    <div class="p-3 border-t border-slate-800 space-y-2.5 bg-slate-950/50">
      <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
        <MapPin class="w-4 h-4 text-blue-400 shrink-0" />
        <select
          :value="sessionStore.selectedCityId"
          @change="sessionStore.changeCity(($event.target as HTMLSelectElement).value)"
          class="bg-transparent text-xs text-slate-200 w-full focus:outline-none cursor-pointer"
        >
          <option
            v-for="city in sessionStore.cities"
            :key="city.id"
            :value="city.id"
            class="bg-slate-900 text-slate-100"
          >
            📍 {{ city.name }}
          </option>
        </select>
      </div>

      <button
        @click="sessionStore.openEntryTab('service-register')"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
      >
        <UserPlus class="w-3.5 h-3.5" />
        <span>Registro de servicio (Abogados)</span>
      </button>

      <div class="flex items-center justify-between pt-1">
        <div class="truncate pr-2">
          <p class="text-xs font-semibold text-slate-200 truncate">
            {{ sessionStore.user?.name || 'Invitado sin sesión' }}
          </p>
          <p class="text-[11px] text-slate-400 truncate">
            {{ sessionStore.user?.email || 'Inicia sesión en el panel central' }}
          </p>
        </div>
        <button
          @click="sessionStore.logoutSession()"
          title="Cambiar usuario / Abrir pestañas de inicio"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </div>
  </aside>
</template>