<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  X,
  Send,
  Building2,
  Hash,
  ShieldAlert,
  ArrowRight,
  ListOrdered,
  FileCheck,
} from 'lucide-vue-next'
import { usePqrsdStore } from '@/stores/pqrsd'

const pqrsdStore = usePqrsdStore()

const formData = ref({
  tipo_peticion_id: 1,
  canal_id: 4, // Virtual por defecto
  dependencia_id: 1,
  asunto: '',
  detalle: '',
})

const radicadoSearch = ref('')
const searchLoading = ref(false)
const searchResult = ref<any>(null)
const searchError = ref('')

const formValidationErrors = computed(() => {
  const errors: string[] = []
  if (formData.value.asunto.trim().length < 5) {
    errors.push('El asunto debe tener al menos 5 caracteres.')
  }
  if (formData.value.detalle.trim().length < 20) {
    errors.push('El detalle o hechos debe tener al menos 20 caracteres.')
  }
  return errors
})

const isFormValid = computed(() => formValidationErrors.value.length === 0)

const selectedTipoPeticion = computed(() => {
  return pqrsdStore.tiposPeticion.find((t) => t.id === formData.value.tipo_peticion_id)
})

async function handleFilePqrs() {
  if (!isFormValid.value) return
  try {
    const created = await pqrsdStore.filePqrsd({
      tipo_peticion_id: Number(formData.value.tipo_peticion_id),
      canal_id: Number(formData.value.canal_id),
      dependencia_id: Number(formData.value.dependencia_id),
      asunto: formData.value.asunto.trim(),
      detalle: formData.value.detalle.trim(),
    })
    // Pre-cargar la búsqueda con el radicado generado y cambiar a consultar
    radicadoSearch.value = created.radicado
    searchResult.value = created
    formData.value.asunto = ''
    formData.value.detalle = ''
  } catch {
    // Manejado en el store
  }
}

async function handleSearchRadicado() {
  if (!radicadoSearch.value.trim()) return
  searchLoading.value = true
  searchError.value = ''
  searchResult.value = null
  try {
    const res = await pqrsdStore.fetchCaseByRadicado(radicadoSearch.value.trim().toUpperCase())
    searchResult.value = res
  } catch (err: any) {
    searchError.value = err.message || 'No se encontró un radicado con ese código.'
  } finally {
    searchLoading.value = false
  }
}

function handleSelectRecent(radicado: string) {
  radicadoSearch.value = radicado
  pqrsdStore.activeTab = 'consultar'
  handleSearchRadicado()
}

function getEstadoBadgeClass(estado: string): string {
  switch (estado) {
    case 'recibida':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    case 'en_tramite':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'respondida':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    case 'vencida':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    case 'cerrada':
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  }
}

function getEstadoLabel(estado: string): string {
  switch (estado) {
    case 'recibida':
      return 'Recibida'
    case 'en_tramite':
      return 'En Trámite'
    case 'respondida':
      return 'Respondida'
    case 'vencida':
      return 'Vencida'
    case 'cerrada':
      return 'Cerrada'
    case 'archivada':
      return 'Archivada'
    default:
      return estado
  }
}
</script>

<template>
  <div
    v-if="pqrsdStore.isPqrsModalOpen"
    class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
  >
    <div
      class="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
    >
      <!-- Header -->
      <div class="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/80 relative flex-shrink-0">
        <button
          @click="pqrsdStore.closePqrsModal"
          class="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          title="Cerrar"
        >
          <X class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <FileText class="w-4 h-4 inline" />
          <span>Sistema Oficial de PQRSD · Ventanilla de Radicación</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Gestión de Peticiones, Quejas, Reclamos y Sugerencias
        </h2>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Endpoints canónicos conectados a la base relacional con plazos de ley oficiales (Resolución 369 de 2019).
        </p>

        <!-- Pestañas -->
        <div class="flex gap-2 mt-4">
          <button
            @click="pqrsdStore.activeTab = 'radicar'"
            class="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2"
            :class="
              pqrsdStore.activeTab === 'radicar'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            "
          >
            <Send class="w-4 h-4" />
            Radicar PQRSD
          </button>
          <button
            @click="pqrsdStore.activeTab = 'consultar'"
            class="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2"
            :class="
              pqrsdStore.activeTab === 'consultar'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            "
          >
            <Search class="w-4 h-4" />
            Consultar Radicado
          </button>
          <button
            @click="pqrsdStore.activeTab = 'lista'"
            class="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2"
            :class="
              pqrsdStore.activeTab === 'lista'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            "
          >
            <ListOrdered class="w-4 h-4" />
            Casos Recientes
          </button>
        </div>
      </div>

      <!-- Cuerpo del modal -->
      <div class="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
        <!-- Notificaciones de éxito o error del store -->
        <div
          v-if="pqrsdStore.successMessage"
          class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-start gap-3"
        >
          <CheckCircle2 class="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
          <div class="space-y-1">
            <p class="font-medium">{{ pqrsdStore.successMessage }}</p>
            <p v-if="pqrsdStore.currentCase" class="text-xs text-slate-300">
              Vence el: <span class="font-mono text-emerald-300">{{ pqrsdStore.currentCase.fecha_vencimiento }}</span>
              ({{ pqrsdStore.currentCase.dias_restantes }} días hábiles).
            </p>
          </div>
        </div>

        <div
          v-if="pqrsdStore.errorMessage"
          class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3"
        >
          <AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p class="font-medium">{{ pqrsdStore.errorMessage }}</p>
          </div>
        </div>

        <!-- TAB 1: RADICAR PQRSD -->
        <div v-if="pqrsdStore.activeTab === 'radicar'" class="space-y-4">
          <form @submit.prevent="handleFilePqrs" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Tipo de Petición -->
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">
                  Tipo de Petición <span class="text-rose-400">*</span>
                </label>
                <select
                  v-model.number="formData.tipo_peticion_id"
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option
                    v-for="t in pqrsdStore.tiposPeticion"
                    :key="t.id"
                    :value="t.id"
                  >
                    {{ t.nombre }} ({{ t.plazo }} días hábiles)
                  </option>
                </select>
                <p v-if="selectedTipoPeticion" class="text-[11px] text-blue-400 mt-1 flex items-center gap-1">
                  <Clock class="w-3 h-3 inline" />
                  Plazo legal por defecto: {{ selectedTipoPeticion.plazo }} días hábiles
                </p>
              </div>

              <!-- Canal de Atención -->
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">
                  Canal de Ingreso <span class="text-rose-400">*</span>
                </label>
                <select
                  v-model.number="formData.canal_id"
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option
                    v-for="c in pqrsdStore.canalesAtencion"
                    :key="c.id"
                    :value="c.id"
                  >
                    {{ c.nombre }}
                  </option>
                </select>
              </div>

              <!-- Dependencia Destino -->
              <div class="sm:col-span-2">
                <label class="block text-xs font-medium text-slate-300 mb-1">
                  Dependencia Responsable <span class="text-rose-400">*</span>
                </label>
                <select
                  v-model.number="formData.dependencia_id"
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option
                    v-for="d in pqrsdStore.dependencias"
                    :key="d.id"
                    :value="d.id"
                  >
                    {{ d.nombre }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Asunto -->
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">
                Asunto del caso <span class="text-rose-400">* (mínimo 5 caracteres)</span>
              </label>
              <input
                v-model="formData.asunto"
                type="text"
                placeholder="Ej: Retraso en entrega de guía TLX-2026-CO-48210"
                class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <!-- Detalle / Hechos -->
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">
                Detalle y hechos de la solicitud <span class="text-rose-400">* (mínimo 20 caracteres)</span>
              </label>
              <textarea
                v-model="formData.detalle"
                rows="4"
                placeholder="Describa claramente los hechos, fechas, guías involucradas y su petición puntual..."
                class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              ></textarea>
              <p class="text-[11px] text-slate-400 mt-1">
                Caracteres: {{ formData.detalle.trim().length }}/5000 (mínimo requerido 20)
              </p>
            </div>

            <!-- Botón Radicar -->
            <div class="pt-2 flex justify-end">
              <button
                type="submit"
                :disabled="!isFormValid || pqrsdStore.isLoading"
                class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
              >
                <Send v-if="!pqrsdStore.isLoading" class="w-4 h-4" />
                <span v-if="pqrsdStore.isLoading">Radicando caso en base de datos...</span>
                <span v-else>Generar Radicado Oficial</span>
              </button>
            </div>
          </form>
        </div>

        <!-- TAB 2: CONSULTAR RADICADO -->
        <div v-if="pqrsdStore.activeTab === 'consultar'" class="space-y-4">
          <div class="flex gap-2">
            <input
              v-model="radicadoSearch"
              type="text"
              placeholder="Ej: PQRSD-2026-000001"
              @keyup.enter="handleSearchRadicado"
              class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
            />
            <button
              @click="handleSearchRadicado"
              :disabled="searchLoading || !radicadoSearch.trim()"
              class="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Search class="w-4 h-4" />
              <span>Consultar</span>
            </button>
          </div>

          <!-- Mensaje de error de búsqueda -->
          <div
            v-if="searchError"
            class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ searchError }}</span>
          </div>

          <!-- Resultado del caso encontrado -->
          <div
            v-if="searchResult"
            class="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3">
              <div>
                <span class="text-xs text-slate-400">Número de Radicado</span>
                <p class="text-lg font-bold font-mono text-blue-400">
                  {{ searchResult.radicado }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="px-3 py-1 rounded-full text-xs font-semibold border"
                  :class="getEstadoBadgeClass(searchResult.estado)"
                >
                  {{ getEstadoLabel(searchResult.estado) }}
                </span>
              </div>
            </div>

            <!-- Detalles del caso -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span class="text-slate-400 block">Asunto:</span>
                <span class="text-white font-medium">{{ searchResult.asunto }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Fecha de Radicación:</span>
                <span class="text-slate-300">{{ new Date(searchResult.fecha_radicacion).toLocaleString('es-CO') }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Fecha de Vencimiento Legal:</span>
                <span class="text-amber-400 font-mono">{{ searchResult.fecha_vencimiento }}</span>
                <span class="text-slate-400 ml-1">({{ searchResult.dias_restantes }} días restantes)</span>
              </div>
              <div>
                <span class="text-slate-400 block">Dependencia Asignada:</span>
                <span class="text-slate-300">Dependencia #{{ searchResult.dependencia_id }}</span>
              </div>
            </div>

            <!-- Hechos / Detalle -->
            <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span class="text-xs text-slate-400 block mb-1">Descripción de la Solicitud:</span>
              <p class="text-xs text-slate-200 whitespace-pre-line">{{ searchResult.detalle }}</p>
            </div>

            <!-- Respuesta oficial si existe -->
            <div
              v-if="searchResult.respuesta"
              class="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/50"
            >
              <div class="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                <FileCheck class="w-4 h-4" />
                <span>Respuesta Oficial Radicada:</span>
              </div>
              <p class="text-xs text-emerald-200 whitespace-pre-line">{{ searchResult.respuesta }}</p>
            </div>

            <!-- Bitácora de Eventos / Estados -->
            <div v-if="searchResult.eventos && searchResult.eventos.length > 0" class="pt-2">
              <span class="text-xs font-semibold text-slate-300 block mb-2">Bitácora de Trazabilidad:</span>
              <div class="space-y-2">
                <div
                  v-for="ev in searchResult.eventos"
                  :key="ev.id"
                  class="flex items-start gap-2 text-xs bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80"
                >
                  <Clock class="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div class="flex-1">
                    <span class="text-slate-300 font-medium">
                      Cambio a estado <span class="text-blue-300 font-semibold">{{ ev.estado_nuevo }}</span>
                    </span>
                    <span v-if="ev.nota" class="text-slate-400 block text-[11px]">{{ ev.nota }}</span>
                  </div>
                  <span class="text-[10px] text-slate-500 font-mono">
                    {{ new Date(ev.ocurrido_en).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: CASOS RECIENTES -->
        <div v-if="pqrsdStore.activeTab === 'lista'" class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400">Casos registrados en la sesión actual</span>
            <button
              @click="pqrsdStore.loadRecentList"
              class="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              Actualizar desde servidor
            </button>
          </div>

          <div v-if="pqrsdStore.recentCases.length === 0" class="text-center py-8 text-slate-500 text-xs">
            No hay casos en el historial aún. Radica una nueva petición para comenzar.
          </div>

          <div
            v-for="c in pqrsdStore.recentCases"
            :key="c.id"
            @click="handleSelectRecent(c.radicado)"
            class="p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition cursor-pointer flex items-center justify-between gap-3"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-blue-400 font-semibold text-xs">{{ c.radicado }}</span>
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-semibold border"
                  :class="getEstadoBadgeClass(c.estado)"
                >
                  {{ getEstadoLabel(c.estado) }}
                </span>
              </div>
              <p class="text-xs text-slate-300 font-medium mt-1 line-clamp-1">{{ c.asunto }}</p>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
