<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Menu, Bot } from 'lucide-vue-next'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import EntryTabsModal from '@/components/entry/EntryTabsModal.vue'
import { useLawyersStore } from '@/stores/lawyers'
import { useSessionStore } from '@/stores/session'

const lawyersStore = useLawyersStore()
const sessionStore = useSessionStore()
const route = useRoute()

onMounted(async () => {
  await lawyersStore.fetchLawyers()
})
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
    <!-- Barra Lateral Izquierda (Drawer en móvil, fija en desktop) -->
    <AppSidebar />

    <!-- Área Principal SPA -->
    <main class="flex-1 h-full overflow-hidden flex flex-col relative min-w-0">
      <!-- Barra superior móvil (< lg) con botón Menú hamburguesa y Toggle Avatar en chat -->
      <header class="lg:hidden h-14 bg-gradient-to-r from-[#0b241e] via-[#081c17] to-[#04100d] border-b border-[#153e34]/70 px-3.5 flex items-center justify-between shrink-0 z-30 select-none">
        <div class="flex items-center gap-2.5">
          <button
            @click="sessionStore.toggleMobileSidebar()"
            class="p-2 -ml-1 rounded-xl bg-[#0f2e26] hover:bg-[#153e34] text-slate-200 transition cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu class="w-5 h-5" />
          </button>
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 flex items-center justify-center shrink-0">
              <img src="/translogix-cab-trans.png" alt="TransLogix Express" class="w-full h-full object-contain filter drop-shadow" />
            </div>
            <h1 class="font-bold text-sm text-white tracking-tight">Remi · TransLogix</h1>
          </div>
        </div>

        <!-- Botón Ver/Ocultar Avatar en vista de chat para móvil -->
        <button
          v-if="route.path === '/'"
          @click="sessionStore.toggleMobileAvatar()"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
          :class="sessionStore.showMobileAvatar ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-slate-800 text-slate-300 hover:text-white'"
        >
          <Bot class="w-4 h-4" />
          <span>{{ sessionStore.showMobileAvatar ? 'Ocultar Avatar' : 'Ver Avatar' }}</span>
        </button>
      </header>

      <div class="flex-1 overflow-hidden relative min-w-0">
        <RouterView />
      </div>
    </main>

    <!-- Modal de Cotización y Despacho -->
    <EntryTabsModal />
  </div>
</template>
