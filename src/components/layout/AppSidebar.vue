<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Scale,
  Home,
  RotateCcw,
  Briefcase,
  BarChart3,
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
  router.push('/')
}

function handleNewInstance() {
  chatStore.startNewInstance()
  if (route.path !== '/') {
    router.push('/')
  }
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

    <!-- Navegación Principal (Orden exacto: Inicio -> Lawyers -> Estadísticas) -->
    <div class="p-3 space-y-1.5">
      <!-- 1. Inicio -->
      <button
        @click="handleGoHome"
        class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer"
        :class="
          route.path === '/'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
            : 'text-slate-300 hover:bg-slate-800'
        "
      >
        <Home class="w-4 h-4" />
        <span>Inicio</span>
      </button>

      <!-- 2. Nueva instancia (Debajo de Inicio) -->
      <button
        @click="handleNewInstance"
        class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-white group"
        title="Reinicia la sesión con un usuario limpio para volver a calificar"
      >
        <RotateCcw class="w-4 h-4 text-emerald-400 group-hover:rotate-[-45deg] transition-transform" />
        <span>Nueva instancia</span>
      </button>

      <!-- 2. Lawyers -->
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

      <!-- 3. Estadísticas -->
      <button
        @click="router.push('/stats')"
        class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer"
        :class="
          route.path === '/stats'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
            : 'text-slate-300 hover:bg-slate-800'
        "
      >
        <BarChart3 class="w-4 h-4" />
        <span>Estadísticas</span>
      </button>
    </div>

    <!-- Sección de Calificación de Satisfacción (1 a 5 Estrellas) en el Sidebar -->
    <!-- (El Historial fue removido según solicitud) -->
    <div class="flex-1 min-h-0 overflow-y-auto px-3 py-2 flex flex-col justify-end">
      <div class="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 shadow-sm space-y-3">
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

          <p v-if="currentRating?.comment" class="text-[11px] text-slate-300 bg-slate-900 border border-slate-800 rounded-lg p-2 italic truncate">
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
            ¿Cómo evalúas tu experiencia con Remi-915?
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

          <div v-else class="space-y-1.5 pt-1 border-t border-slate-800">
            <textarea
              v-model="comment"
              rows="2"
              placeholder="Escribe tu sugerencia..."
              class="w-full text-xs text-slate-100 bg-slate-900 border border-slate-800 rounded-lg p-2 focus:border-amber-400/60 focus:outline-none resize-none"
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
