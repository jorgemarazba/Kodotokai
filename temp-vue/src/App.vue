<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import EntryTabsModal from '@/components/entry/EntryTabsModal.vue'
import { useSessionStore } from '@/stores/session'
import { useLawyersStore } from '@/stores/lawyers'

const sessionStore = useSessionStore()
const lawyersStore = useLawyersStore()

onMounted(async () => {
  await sessionStore.checkVectorSession()
  await lawyersStore.fetchLawyers()
})
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
    <!-- Barra Lateral Izquierda (Nuevo chat -> Lawyers -> Multiservice) -->
    <AppSidebar />

    <!-- Área Principal SPA -->
    <main class="flex-1 h-full overflow-hidden relative">
      <RouterView />
    </main>

    <!-- Pestañas Centrales de Inicio: 1. Usuario / 2. Registro de servicio -->
    <EntryTabsModal />
  </div>
</template>