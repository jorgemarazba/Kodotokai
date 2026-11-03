<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Truck,
  CheckCircle2,
  X,
  Package,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-vue-next'
import { useSessionStore } from '@/stores/session'
import { useTranslogixStore, MUNICIPALITIES, TRANSLOGIX_SERVICES } from '@/stores/translogix'

const router = useRouter()
const sessionStore = useSessionStore()
const translogixStore = useTranslogixStore()

const dispatchForm = ref({
  senderName: '',
  contactPhone: '+57 ',
  serviceCode: 'ULTIMA_MILLA',
  originCity: 'Bogotá D.C.',
  destCity: 'Medellín',
  weightKg: 5,
  lengthCm: 30,
  widthCm: 25,
  heightCm: 20,
  declaredValueCop: 250000,
  isColdChain: false,
  isDangerousCargo: false,
})

const generatedGuideNumber = ref<string | null>(null)
const formError = ref('')

const quote = computed(() => {
  return translogixStore.calculateQuote({
    originCity: dispatchForm.value.originCity,
    destCity: dispatchForm.value.destCity,
    weightKg: Number(dispatchForm.value.weightKg) || 1,
    lengthCm: Number(dispatchForm.value.lengthCm) || 10,
    widthCm: Number(dispatchForm.value.widthCm) || 10,
    heightCm: Number(dispatchForm.value.heightCm) || 10,
    declaredValueCop: Number(dispatchForm.value.declaredValueCop) || 50000,
    isColdChain: dispatchForm.value.isColdChain,
    isDangerousCargo: dispatchForm.value.isDangerousCargo,
  })
})

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val)
}

function handleGenerateGuide() {
  formError.value = ''
  if (!dispatchForm.value.senderName.trim()) {
    formError.value = 'Por favor ingresa el nombre de la empresa o remitente.'
    return
  }
  const randomSuffix = Math.floor(100000 + Math.random() * 900000)
  generatedGuideNumber.value = `TLX-2026-CO-${randomSuffix}`
}

function handleClose() {
  sessionStore.showEntryModal = false
  generatedGuideNumber.value = null
}

function handleGoToServices() {
  handleClose()
  router.push('/servicios')
}
</script>

<template>
  <div
    v-if="sessionStore.showEntryModal"
    class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
  >
    <div class="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
      <!-- Encabezado del Modal -->
      <div class="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/60 relative">
        <button
          @click="handleClose"
          class="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <img src="/logo.png" alt="TransLogix Logo" class="w-4 h-4 object-contain inline" />
          <span>TransLogix Colombia · Solicitud de Despacho</span>
        </div>
        <h2 class="text-xl font-bold text-white">Cotizador Oficial y Generación de Guía</h2>
        <p class="text-xs text-slate-400 mt-0.5">
          Calcula el flete volumétrico oficial (factor 4000) y genera tu orden de transporte nacional.
        </p>
      </div>

      <!-- Pantalla de Éxito al Generar Guía -->
      <div v-if="generatedGuideNumber" class="p-6 space-y-4 text-center">
        <div class="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
          <CheckCircle2 class="w-8 h-8" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-white">¡Despacho Registrado con Éxito!</h3>
          <p class="text-xs text-slate-400 mt-1">Tu orden ha sido registrada en el sistema logístico de TransLogix Colombia.</p>
        </div>

        <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2 text-xs">
          <div class="flex justify-between items-center pb-2 border-b border-slate-800">
            <span class="text-slate-400">Número de Guía Oficial:</span>
            <span class="font-mono font-bold text-sm text-blue-400">{{ generatedGuideNumber }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Ruta:</span>
            <span class="text-white font-medium">{{ dispatchForm.originCity }} → {{ dispatchForm.destCity }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Peso Facturable:</span>
            <span class="text-white font-medium">{{ quote.billableWeightKg }} kg (Volumétrico: {{ quote.volWeightKg }} kg)</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Tiempo de Entrega (SLA):</span>
            <span class="text-emerald-400 font-bold">{{ quote.estimatedHours }} horas</span>
          </div>
          <div class="flex justify-between pt-2 border-t border-slate-800 text-sm">
            <span class="text-white font-bold">Flete Total Liquidado:</span>
            <span class="text-blue-400 font-extrabold">{{ formatCurrency(quote.totalFreightCop) }}</span>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            @click="handleClose"
            class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
          >
            Cerrar
          </button>
          <button
            @click="handleGoToServices"
            class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-blue-600/30"
          >
            Ver Portal de Servicios
          </button>
        </div>
      </div>

      <!-- Formulario de Cotización y Despacho -->
      <div v-else class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <div v-if="formError" class="p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-xs text-red-300">
          {{ formError }}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-300 mb-1">Nombre Remitente / Empresa *</label>
            <input
              v-model="dispatchForm.senderName"
              type="text"
              placeholder="Ej. Distribuciones Andinas S.A.S."
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-xs text-slate-300 mb-1">Teléfono o WhatsApp de Contacto</label>
            <input
              v-model="dispatchForm.contactPhone"
              type="text"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-xs text-slate-300 mb-1">Ciudad de Origen</label>
            <select
              v-model="dispatchForm.originCity"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option v-for="m in MUNICIPALITIES" :key="m.daneCode" :value="m.municipality">
                {{ m.municipality }} ({{ m.department }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs text-slate-300 mb-1">Ciudad de Destino</label>
            <select
              v-model="dispatchForm.destCity"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option v-for="m in MUNICIPALITIES" :key="m.daneCode" :value="m.municipality">
                {{ m.municipality }} ({{ m.department }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs text-slate-300 mb-1">Línea de Servicio</label>
            <select
              v-model="dispatchForm.serviceCode"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option v-for="s in TRANSLOGIX_SERVICES" :key="s.code" :value="s.code">
                {{ s.shortTitle }} ({{ s.badge }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs text-slate-300 mb-1">Valor Declarado (COP)</label>
            <input
              v-model.number="dispatchForm.declaredValueCop"
              type="number"
              min="10000"
              step="50000"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <!-- Dimensiones y Peso -->
        <div>
          <label class="block text-xs text-slate-300 mb-1">
            Peso y Dimensiones (Largo × Ancho × Alto) / 4.000
          </label>
          <div class="grid grid-cols-4 gap-2">
            <div>
              <span class="text-[10px] text-slate-400 block">Peso Real (kg)</span>
              <input
                v-model.number="dispatchForm.weightKg"
                type="number"
                min="0.5"
                step="0.5"
                class="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs text-white text-center"
              />
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block">Largo (cm)</span>
              <input
                v-model.number="dispatchForm.lengthCm"
                type="number"
                min="1"
                class="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs text-white text-center"
              />
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block">Ancho (cm)</span>
              <input
                v-model.number="dispatchForm.widthCm"
                type="number"
                min="1"
                class="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs text-white text-center"
              />
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block">Alto (cm)</span>
              <input
                v-model.number="dispatchForm.heightCm"
                type="number"
                min="1"
                class="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs text-white text-center"
              />
            </div>
          </div>
        </div>

        <!-- Checkboxes Especiales -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <label class="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
            <input v-model="dispatchForm.isColdChain" type="checkbox" class="rounded border-slate-700" />
            <span class="text-slate-300">Cadena de Frío (-20°C a 8°C) +25%</span>
          </label>
          <label class="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
            <input v-model="dispatchForm.isDangerousCargo" type="checkbox" class="rounded border-slate-700" />
            <span class="text-slate-300">Carga Peligrosa Regulada ONU</span>
          </label>
        </div>

        <!-- Tarjeta de Resumen en Vivo -->
        <div class="bg-blue-600/10 border border-blue-500/30 rounded-xl p-3 text-xs flex items-center justify-between">
          <div>
            <span class="text-[11px] text-slate-400">Total a Liquidar (SLA: {{ quote.estimatedHours }}h):</span>
            <p class="text-lg font-bold text-white">{{ formatCurrency(quote.totalFreightCop) }}</p>
          </div>
          <span class="text-[11px] px-2 py-1 rounded bg-blue-500/20 text-blue-300 font-mono">
            Peso facturado: {{ quote.billableWeightKg }} kg
          </span>
        </div>

        <button
          @click="handleGenerateGuide"
          class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Confirmar y Generar Número de Guía</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
