<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Truck,
  Package,
  Thermometer,
  Layers,
  RotateCcw,
  Calculator,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  ArrowRight,
  Sparkles,
} from 'lucide-vue-next'
import {
  useTranslogixStore,
  TRANSLOGIX_SERVICES,
  ROUTE_TARIFFS,
  MUNICIPALITIES,
  DANGEROUS_GOODS,
  PROHIBITED_ITEMS,
} from '@/stores/translogix'
import { useSessionStore } from '@/stores/session'

const translogixStore = useTranslogixStore()
const sessionStore = useSessionStore()

const activeTab = ref<'servicios' | 'cotizador' | 'cobertura' | 'peligrosas'>('servicios')

// Cotizador State
const quoteForm = ref({
  originCity: 'Bogotá D.C.',
  destCity: 'Medellín',
  weightKg: 5,
  lengthCm: 30,
  widthCm: 25,
  heightCm: 20,
  declaredValueCop: 350000,
  isColdChain: false,
  isDangerousCargo: false,
})

const quoteResult = computed(() => {
  return translogixStore.calculateQuote(quoteForm.value)
})

// Cobertura Search
const coverageSearch = ref('')
const filteredMunicipalities = computed(() => {
  if (!coverageSearch.value.trim()) return MUNICIPALITIES
  const q = coverageSearch.value.toLowerCase()
  return MUNICIPALITIES.filter(
    (m) =>
      m.municipality.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q) ||
      m.assignedHub.toLowerCase().includes(q) ||
      m.daneCode.includes(q)
  )
})

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val)
}

function getServiceIcon(iconName: string) {
  switch (iconName) {
    case 'Truck':
      return Truck
    case 'Package':
      return Package
    case 'Thermometer':
      return Thermometer
    case 'Layers':
      return Layers
    case 'RotateCcw':
      return RotateCcw
    default:
      return Truck
  }
}
</script>

<template>
  <div class="h-full overflow-y-auto p-3.5 sm:p-6 bg-slate-950">
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Encabezado Principal TransLogix Colombia -->
      <div class="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xl">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div class="space-y-1.5">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
              <div class="w-5 h-5 rounded bg-white/95 p-0.5 flex items-center justify-center shrink-0 shadow-sm border border-white/20 inline-flex">
                <img src="/icons/nav-transporte.png" alt="Transporte" class="w-full h-full object-contain" />
              </div>
              <span>TransLogix Colombia S.A.S. · NIT 901.684.329-8</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Portal de Servicios & Transporte Nacional
            </h1>
            <p class="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Soluciones integrales de carga masiva FTL/LTL, paquetería express Same Day, cadena de frío certificada (-20°C a 8°C) y almacenamiento e-commerce en Zona Franca Fontibón.
            </p>
          </div>

          <button
            @click="sessionStore.openEntryTab('service-register')"
            class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition cursor-pointer shrink-0"
          >
            <Calculator class="w-4 h-4" />
            <span>Cotizar Despacho Rápido</span>
          </button>
        </div>
      </div>

      <!-- Barra de Pestañas de Navegación -->
      <div class="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto select-none">
        <button
          @click="activeTab = 'servicios'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0"
          :class="activeTab === 'servicios' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
        >
          <Layers class="w-4 h-4" />
          <span>Líneas de Servicio (5)</span>
        </button>

        <button
          @click="activeTab = 'cotizador'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0"
          :class="activeTab === 'cotizador' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
        >
          <Calculator class="w-4 h-4" />
          <span>Cotizador Oficial de Fletes</span>
        </button>

        <button
          @click="activeTab = 'cobertura'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0"
          :class="activeTab === 'cobertura' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
        >
          <MapPin class="w-4 h-4" />
          <span>Coberturas & Rutas (32)</span>
        </button>

        <button
          @click="activeTab = 'peligrosas'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0"
          :class="activeTab === 'peligrosas' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
        >
          <AlertTriangle class="w-4 h-4" />
          <span>Mercancías Peligrosas (ONU)</span>
        </button>
      </div>

      <!-- TAB 1: PORTAFOLIO DE SERVICIOS -->
      <div v-if="activeTab === 'servicios'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="srv in TRANSLOGIX_SERVICES"
          :key="srv.id"
          class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/50 transition-colors shadow-lg"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <component :is="getServiceIcon(srv.icon)" class="w-5 h-5" />
              </div>
              <span class="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-blue-300 border border-slate-700">
                {{ srv.badge }}
              </span>
            </div>

            <div>
              <h3 class="font-bold text-base text-white leading-snug">{{ srv.title }}</h3>
              <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">{{ srv.description }}</p>
            </div>

            <!-- Características -->
            <ul class="space-y-1.5 pt-2 border-t border-slate-800/80">
              <li
                v-for="(f, i) in srv.features"
                :key="i"
                class="flex items-start gap-2 text-xs text-slate-300"
              >
                <CheckCircle2 class="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{{ f }}</span>
              </li>
            </ul>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span class="flex items-center gap-1 font-medium text-slate-300">
              <Clock class="w-3.5 h-3.5 text-amber-400" />
              SLA: {{ srv.sla }}
            </span>
            <span class="truncate max-w-[150px] text-slate-400 text-right">{{ srv.equipment }}</span>
          </div>
        </div>
      </div>

      <!-- TAB 2: COTIZADOR OFICIAL DE FLETES -->
      <div v-else-if="activeTab === 'cotizador'" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Formulario de Parámetros -->
        <div class="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div class="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Calculator class="w-4 h-4" />
            <span>Parámetros de Envío y Cubicaje</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-300 font-medium mb-1">Ciudad de Origen</label>
              <select
                v-model="quoteForm.originCity"
                class="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option v-for="m in MUNICIPALITIES" :key="m.daneCode" :value="m.municipality">
                  {{ m.municipality }} ({{ m.department }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs text-slate-300 font-medium mb-1">Ciudad de Destino</label>
              <select
                v-model="quoteForm.destCity"
                class="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option v-for="m in MUNICIPALITIES" :key="m.daneCode" :value="m.municipality">
                  {{ m.municipality }} ({{ m.department }})
                </option>
              </select>
            </div>
          </div>

          <!-- Peso Real y Valor Declarado -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-300 font-medium mb-1">Peso Real de Báscula (kg)</label>
              <input
                v-model.number="quoteForm.weightKg"
                type="number"
                min="0.1"
                step="0.5"
                class="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs text-slate-300 font-medium mb-1">Valor Declarado (COP)</label>
              <input
                v-model.number="quoteForm.declaredValueCop"
                type="number"
                min="10000"
                step="50000"
                class="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <!-- Dimensiones para factor volumétrico (4000) -->
          <div>
            <label class="block text-xs text-slate-300 font-medium mb-1.5">
              Dimensiones del Empaque (cm) · Factor Volumétrico: (L × A × A) / 4.000
            </label>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <span class="text-[10px] text-slate-400 block mb-0.5">Largo (cm)</span>
                <input
                  v-model.number="quoteForm.lengthCm"
                  type="number"
                  min="1"
                  class="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white text-center"
                />
              </div>
              <div>
                <span class="text-[10px] text-slate-400 block mb-0.5">Ancho (cm)</span>
                <input
                  v-model.number="quoteForm.widthCm"
                  type="number"
                  min="1"
                  class="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white text-center"
                />
              </div>
              <div>
                <span class="text-[10px] text-slate-400 block mb-0.5">Alto (cm)</span>
                <input
                  v-model.number="quoteForm.heightCm"
                  type="number"
                  min="1"
                  class="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white text-center"
                />
              </div>
            </div>
          </div>

          <!-- Opciones Especiales -->
          <div class="pt-2 border-t border-slate-800 space-y-2">
            <label class="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
              <input
                v-model="quoteForm.isColdChain"
                type="checkbox"
                class="rounded border-slate-700 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <div class="text-xs">
                <span class="font-bold text-white block">Cadena de Frío Certificada (-20°C a 8°C)</span>
                <span class="text-slate-400 text-[11px]">Aplica sobretasa del +25% sobre el flete base con furgón termo y telemetría.</span>
              </div>
            </label>

            <label class="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
              <input
                v-model="quoteForm.isDangerousCargo"
                type="checkbox"
                class="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <div class="text-xs">
                <span class="font-bold text-white block">Mercancía Peligrosa Clasificada (ONU / IMO)</span>
                <span class="text-slate-400 text-[11px]">Aplica recargo especial por manejo de materiales regulados y manifiesto ambiental.</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Resultados y Liquidación Oficial -->
        <div class="lg:col-span-5 bg-gradient-to-b from-slate-900 to-blue-950/30 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-blue-400 uppercase tracking-wider">Liquidación Oficial</span>
              <span class="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                {{ quoteResult.routeCode }}
              </span>
            </div>

            <!-- Resumen de Pesos -->
            <div class="grid grid-cols-2 gap-2 bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs">
              <div>
                <span class="text-[11px] text-slate-400">Peso Volumétrico:</span>
                <p class="font-bold text-white">{{ quoteResult.volWeightKg }} kg</p>
              </div>
              <div>
                <span class="text-[11px] text-slate-400">Peso a Facturar:</span>
                <p class="font-bold text-emerald-400">{{ quoteResult.billableWeightKg }} kg</p>
              </div>
            </div>

            <!-- Desglose de Rubros -->
            <div class="space-y-2 text-xs">
              <div class="flex justify-between py-1 border-b border-slate-800">
                <span class="text-slate-300">Flete Base Calculado:</span>
                <span class="font-medium text-white">{{ formatCurrency(quoteResult.calculatedFreight) }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-800">
                <span class="text-slate-300">Seguro Contractual (1% mín.):</span>
                <span class="font-medium text-white">{{ formatCurrency(quoteResult.insurance) }}</span>
              </div>
              <div v-if="quoteResult.coldSurcharge > 0" class="flex justify-between py-1 border-b border-slate-800 text-blue-300">
                <span>Sobretasa Cadena de Frío (+25%):</span>
                <span class="font-medium">{{ formatCurrency(quoteResult.coldSurcharge) }}</span>
              </div>
              <div v-if="quoteResult.dangerousCargo > 0" class="flex justify-between py-1 border-b border-slate-800 text-amber-300">
                <span>Recargo Carga Peligrosa:</span>
                <span class="font-medium">{{ formatCurrency(quoteResult.dangerousCargo) }}</span>
              </div>
            </div>

            <!-- Total Destacado -->
            <div class="bg-blue-600/15 border border-blue-500/40 rounded-xl p-4 text-center">
              <span class="text-[11px] text-blue-300 uppercase tracking-wider font-semibold block">Flete Total Estimado (COP)</span>
              <p class="text-3xl font-extrabold text-white mt-1">{{ formatCurrency(quoteResult.totalFreightCop) }}</p>
              <div class="flex items-center justify-center gap-1.5 text-xs text-blue-200 mt-2 font-medium">
                <Clock class="w-3.5 h-3.5 text-amber-400" />
                <span>Tiempo estimado de entrega: {{ quoteResult.estimatedHours }} horas</span>
              </div>
            </div>

            <p class="text-[11px] text-slate-400 italic text-center">
              {{ quoteResult.notes }}
            </p>
          </div>

          <button
            @click="sessionStore.openEntryTab('service-register')"
            class="mt-4 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Generar Orden de Despacho</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- TAB 3: MATRIZ DE COBERTURAS & RUTAS (32 MUNICIPIOS) -->
      <div v-else-if="activeTab === 'cobertura'" class="space-y-4">
        <!-- Buscador -->
        <div class="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
          <Search class="w-4 h-4 text-slate-400 shrink-0" />
          <input
            v-model="coverageSearch"
            type="text"
            placeholder="Buscar por municipio, departamento, hub asignado o código DANE..."
            class="w-full bg-transparent text-xs text-white focus:outline-none"
          />
        </div>

        <!-- Tabla Responsiva de Municipios -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th class="px-4 py-3">Municipio / DANE</th>
                  <th class="px-4 py-3">Departamento</th>
                  <th class="px-4 py-3">Tipo Cobertura</th>
                  <th class="px-4 py-3">SLA Entrega</th>
                  <th class="px-4 py-3">Servicios Disponibles</th>
                  <th class="px-4 py-3">Hub Asignado</th>
                  <th class="px-4 py-3">Frecuencia</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-medium">
                <tr
                  v-for="m in filteredMunicipalities"
                  :key="m.daneCode"
                  class="hover:bg-slate-800/40 transition-colors"
                >
                  <td class="px-4 py-3 text-white font-bold">
                    {{ m.municipality }}
                    <span class="block text-[10px] text-slate-500 font-mono">DANE: {{ m.daneCode }}</span>
                  </td>
                  <td class="px-4 py-3">{{ m.department }}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-blue-300 border border-slate-700">
                      {{ m.coverageType }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-emerald-400 font-bold">
                    {{ m.standardHours }}h
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1.5">
                      <span
                        v-if="m.sameDay"
                        class="px-2 py-0.5 rounded-md text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      >
                        Same Day
                      </span>
                      <span
                        v-if="m.refrigerated"
                        class="px-2 py-0.5 rounded-md text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/30"
                      >
                        Frío (-20° a 8°)
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3 font-mono text-[11px] text-slate-400">{{ m.assignedHub }}</td>
                  <td class="px-4 py-3 text-slate-400 text-[11px]">{{ m.dispatchFrequency }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: MERCANCÍAS PELIGROSAS & NORMATIVA -->
      <div v-else-if="activeTab === 'peligrosas'" class="space-y-5">
        <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <h4 class="font-bold text-amber-300">Normativa Nacional e Internacional de Transporte Terrestre</h4>
            <p class="text-slate-300 leading-relaxed">
              TransLogix Colombia opera bajo el <strong>Decreto 1079 de 2015</strong>, la <strong>Norma Técnica Colombiana NTC 1692</strong> y las directrices del Libro Naranja de la ONU. Toda carga clasificada como peligrosa debe incluir la Ficha de Datos de Seguridad (FDS/MSDS de 16 secciones) y embalajes homologados con rotulado visible.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="dg in DANGEROUS_GOODS"
            :key="dg.classNumber"
            class="bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between"
            :class="
              dg.status === 'PROHIBIDO'
                ? 'border-red-500/40 bg-red-950/10'
                : dg.status === 'RESTRINGIDO'
                ? 'border-amber-500/40'
                : 'border-slate-800'
            "
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-xs text-blue-400">
                  CLASE {{ dg.classNumber }}
                </span>
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  :class="
                    dg.status === 'PROHIBIDO'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  "
                >
                  {{ dg.status }}
                </span>
              </div>

              <h4 class="font-bold text-sm text-white">{{ dg.name }}</h4>
              <p class="text-xs text-slate-400 leading-relaxed">{{ dg.description }}</p>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-800/80 text-[11px] space-y-1">
              <p class="text-slate-300"><strong>Política:</strong> {{ dg.policy }}</p>
              <p class="text-slate-400"><strong>Embalaje:</strong> {{ dg.packingAdvice }}</p>
            </div>
          </div>
        </div>

        <!-- Lista de Prohibiciones Absolutas -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 class="font-bold text-sm text-red-400 flex items-center gap-2">
            <XCircle class="w-4 h-4" />
            <span>Artículos Prohibidos de Forma Absoluta en la Red TransLogix</span>
          </h4>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(p, i) in PROHIBITED_ITEMS"
              :key="i"
              class="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium"
            >
              ⛔ {{ p }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
