<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Truck,
  PackageCheck,
  X,
  Briefcase,
  UserPlus,
  Settings,
  ChevronDown,
  Volume2,
  Star,
  CheckCircle2,
  Edit3,
  Send,
} from 'lucide-vue-next'
import { useSessionStore } from '@/stores/session'
import { useLawyersStore } from '@/stores/lawyers'
import { useChatStore } from '@/stores/chat'
import { useStatsStore } from '@/stores/stats'

const router = useRouter()
const route = useRoute()
const sessionStore = useSessionStore()
const lawyersStore = useLawyersStore()
const chatStore = useChatStore()
const statsStore = useStatsStore()

const showSettings = ref(false)

function handleGoHome() {
  sessionStore.closeMobileSidebar()
  router.push('/')
}

function handleNewInstance() {
  sessionStore.closeMobileSidebar()
  chatStore.startNewInstance()
  if (route.path !== '/') {
    router.push('/')
  }
}

function handleNavigate(path: string) {
  sessionStore.closeMobileSidebar()
  router.push(path)
}

function handleOpenRegister() {
  sessionStore.closeMobileSidebar()
  sessionStore.openEntryTab('service-register')
}

function handleVoiceChange(event: Event) {
  chatStore.applyVoiceProfile?.((event.target as HTMLSelectElement).value)
}

function handlePitchChange() {
  chatStore.testSelectedVoice?.()
}

// Satisfacción de 1 a 5 estrellas en el Sidebar
const targetConvId = computed(() => chatStore.activeConversationId || 'general-sidebar')
const currentRating = computed(() => statsStore.getRating(targetConvId.value))

const hoverStars = ref(0)
const selectedStars = computed(() => currentRating.value?.stars || 0)
const isSubmitted = computed(() => Boolean(currentRating.value?.stars))
const isEditing = ref(false)
const showCommentInput = ref(false)
const comment = ref('')
const isSaving = ref(false)

const ratingLabels: Record<number, string> = {
  1: 'Muy insatisfecho',
  2: 'Podría mejorar',
  3: 'Aceptable / Regular',
  4: 'Buena atención',
  5: '¡Excelente servicio!',
}

const activeScore = computed(() => hoverStars.value || selectedStars.value)

watch(targetConvId, () => {
  hoverStars.value = 0
  isEditing.value = false
  showCommentInput.value = false
  comment.value = currentRating.value?.comment || ''
})

async function handleRate(stars: number) {
  isSaving.value = true
  await statsStore.submitRating({
    conversationId: targetConvId.value,
    stars,
    comment: comment.value || currentRating.value?.comment,
  })
  isSaving.value = false
  isEditing.value = false
}

async function handleSaveComment() {
  if (!selectedStars.value) return
  isSaving.value = true
  await statsStore.submitRating({
    conversationId: targetConvId.value,
    stars: selectedStars.value,
    comment: comment.value,
  })
  isSaving.value = false
  showCommentInput.value = false
}

function handleEdit() {
  isEditing.value = true
  comment.value = currentRating.value?.comment || ''
  showCommentInput.value = true
}
</script>

<template>
  <!-- Backdrop oscuro para móvil cuando el sidebar está abierto -->
  <div
    v-if="sessionStore.isMobileSidebarOpen"
    @click="sessionStore.closeMobileSidebar()"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
  ></div>

  <!-- Sidebar: en desktop es fija (lg:static / lg:translate-x-0); en móvil es drawer flotante (fixed z-50) -->
  <aside
    class="fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-[#0b241e] via-[#081c17] to-[#04100d] border-r border-[#153e34]/70 flex flex-col h-full select-none shrink-0 transition-transform duration-300 ease-in-out"
    :class="sessionStore.isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'"
  >
    <!-- Logo Superior con botón para cerrar en móvil -->
    <div class="p-4 border-b border-[#153e34]/60 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 flex items-center justify-center shrink-0">
          <img src="/translogix-cab-trans.png" alt="TransLogix Express" class="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(34,197,94,0.3)]" />
        </div>
        <div>
          <h1 class="font-bold text-base text-white tracking-tight">TransLogix Colombia</h1>
          <p class="text-xs text-emerald-400 font-medium">Logística & Transporte</p>
        </div>
      </div>
      <button
        @click="sessionStore.closeMobileSidebar()"
        class="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0f2e26] transition cursor-pointer"
        aria-label="Cerrar menú"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Navegación Principal con los nuevos iconos personalizados de TransLogix -->
    <div class="p-3 space-y-2">
      <!-- 1. Inicio -->
      <button
        @click="handleGoHome"
        class="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer group"
        :class="
          route.path === '/'
            ? 'bg-emerald-600/80 text-white shadow-md shadow-emerald-900/40 border border-emerald-400/30'
            : 'text-slate-300 hover:bg-[#0f2e26]/80 hover:text-white'
        "
      >
        <img
          src="/icons/nav-inicio.png"
          alt="Inicio"
          class="w-7 h-7 object-contain shrink-0 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform"
        />
        <span>Inicio</span>
      </button>

      <!-- 2. Nueva instancia -->
      <button
        @click="handleNewInstance"
        class="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer text-slate-300 hover:bg-[#0f2e26]/80 hover:text-white group"
        title="Reinicia la sesión con un usuario limpio para volver a calificar"
      >
        <img
          src="/icons/nav-nueva-instancia.png"
          alt="Nueva instancia"
          class="w-7 h-7 object-contain shrink-0 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform"
        />
        <span>Nueva instancia</span>
      </button>

      <!-- 3. Transporte y Servicio -->
      <button
        @click="handleNavigate('/servicios')"
        class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer group"
        :class="
          route.path === '/servicios' || route.path === '/lawyers'
            ? 'bg-emerald-600/80 text-white shadow-md shadow-emerald-900/40 border border-emerald-400/30'
            : 'text-slate-300 hover:bg-[#0f2e26]/80 hover:text-white'
        "
      >
        <span class="flex items-center gap-3.5 min-w-0">
          <img
            src="/icons/nav-transporte.png"
            alt="Transporte y Servicio"
            class="w-7 h-7 object-contain shrink-0 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform"
          />
          <span class="truncate">Servicios & Transporte</span>
        </span>
        <span class="text-xs px-2 py-0.5 rounded-full bg-[#051813] text-emerald-300 border border-[#153e34]">
          5
        </span>
      </button>

      <!-- 4. Estadísticas -->
      <button
        @click="handleNavigate('/stats')"
        class="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer group"
        :class="
          route.path === '/stats'
            ? 'bg-emerald-600/80 text-white shadow-md shadow-emerald-900/40 border border-emerald-400/30'
            : 'text-slate-300 hover:bg-[#0f2e26]/80 hover:text-white'
        "
      >
        <img
          src="/icons/nav-estadisticas.png"
          alt="Estadísticas"
          class="w-7 h-7 object-contain shrink-0 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform"
        />
        <span>Estadísticas</span>
      </button>
    </div>

    <!-- Sección de Calificación de Satisfacción (1 a 5 Estrellas) en el Sidebar -->
    <!-- (El Historial fue removido según solicitud) -->
    <div class="flex-1 min-h-0 overflow-y-auto px-3 py-2 flex flex-col justify-end">
      <div class="bg-[#04120e]/85 border border-[#153e34]/80 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
            <Star class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Satisfacción</span>
          </span>
          <span v-if="selectedStars && !isEditing" class="text-xs font-bold text-amber-400">
            {{ selectedStars }} / 5
          </span>
        </div>

        <!-- Estado: Ya calificado -->
        <div v-if="isSubmitted && !isEditing" class="text-center space-y-2 py-1">
          <div class="flex items-center justify-center gap-1 text-emerald-400 text-xs font-medium">
            <CheckCircle2 class="w-4 h-4" />
            <span>¡Gracias por calificar!</span>
          </div>

          <div class="flex justify-center items-center gap-1 py-0.5">
            <Star
              v-for="s in 5"
              :key="s"
              class="w-4 h-4 transition-transform"
              :class="s <= selectedStars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'"
            />
          </div>

          <p class="text-[11px] text-slate-400">
            {{ ratingLabels[selectedStars] }}
          </p>

          <p v-if="currentRating?.comment" class="text-[11px] text-slate-300 bg-[#061813] border border-[#153e34] rounded-lg p-2 italic truncate">
            "{{ currentRating.comment }}"
          </p>

          <button
            @click="handleEdit"
            class="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer pt-1"
          >
            <Edit3 class="w-3 h-3" />
            <span>Editar calificación</span>
          </button>
        </div>

        <!-- Estado: Por calificar o Editando -->
        <div v-else class="space-y-2.5">
          <p class="text-xs text-slate-300 text-center leading-snug">
            ¿Cómo evalúas tu experiencia con Remi en TransLogix Colombia?
          </p>

          <!-- 5 Estrellas interactivas -->
          <div class="flex justify-center items-center gap-1 py-1" @mouseleave="hoverStars = 0">
            <button
              v-for="s in 5"
              :key="s"
              @mouseenter="hoverStars = s"
              @click="handleRate(s)"
              :title="`Calificar con ${s} estrellas`"
              class="p-0.5 rounded transition transform hover:scale-125 cursor-pointer focus:outline-none"
            >
              <Star
                class="w-5 h-5 transition-colors"
                :class="
                  s <= activeScore
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                    : 'text-slate-600 hover:text-slate-400'
                "
              />
            </button>
          </div>

          <!-- Etiqueta del puntaje -->
          <p class="text-center text-[11px] font-medium h-4 transition-colors" :class="activeScore ? 'text-amber-300' : 'text-slate-500'">
            {{ activeScore ? `${activeScore}★ · ${ratingLabels[activeScore]}` : 'Toca una estrella para calificar' }}
          </p>

          <!-- Comentario opcional -->
          <div v-if="!showCommentInput" class="text-center pt-0.5">
            <button
              @click="showCommentInput = true"
              class="text-[11px] text-slate-400 hover:text-slate-200 transition underline underline-offset-2 cursor-pointer"
            >
              Dejar sugerencia
            </button>
          </div>

          <div v-else class="space-y-1.5 pt-1 border-t border-[#153e34]/70">
            <textarea
              v-model="comment"
              rows="2"
              placeholder="Escribe tu sugerencia..."
              class="w-full text-xs text-slate-100 bg-[#061813] border border-[#153e34] rounded-lg p-2 focus:border-amber-400/60 focus:outline-none resize-none"
            ></textarea>
            <div class="flex items-center justify-end gap-1.5">
              <button
                @click="showCommentInput = false"
                class="px-2 py-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                @click="handleSaveComment"
                :disabled="isSaving || !selectedStars"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-[11px] transition cursor-pointer"
              >
                <Send class="w-3 h-3" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Botón Registro de Servicio y Ajustes de Voz -->
    <div class="p-3 border-t border-[#153e34]/70 space-y-2.5 bg-[#030e0b]/90">
      <button
        @click="handleOpenRegister"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
      >
        <PackageCheck class="w-3.5 h-3.5" />
        <span>Cotizar Envío / Servicio</span>
      </button>

      <div v-if="showSettings" class="space-y-2 text-[11px] text-slate-300">
        <div class="flex items-center gap-1.5 bg-[#061813] border border-[#153e34] rounded-lg px-2.5 py-1.5">
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
              class="bg-[#061813] text-slate-200"
            >
              {{ v.label }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-1.5 bg-[#061813] border border-[#153e34] rounded-lg px-2.5 py-1.5">
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
        class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#0f2e26]/80 border border-[#153e34] transition cursor-pointer"
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
