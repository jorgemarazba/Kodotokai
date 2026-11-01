<script setup lang="ts">
import { ref } from 'vue'
import {
  ShieldAlert,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  UserCheck,
  Navigation,
  Clock,
} from 'lucide-vue-next'
import { useMultiserviceStore } from '@/stores/multiservice'
import { useSessionStore } from '@/stores/session'

const multiserviceStore = useMultiserviceStore()
const sessionStore = useSessionStore()

const activeTab = ref<'cais' | 'inspectors'>('cais')
</script>

<template>
  <div class="h-full overflow-y-auto p-6 bg-slate-950">
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Encabezado Multiservice con Selector de Ciudad -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div class="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase">
            <ShieldAlert class="w-4 h-4" />
            <span>Directorio de Autoridades de Policía y Convivencia (Ley 1801 de 2016)</span>
          </div>
          <h2 class="text-xl font-bold text-white mt-1">
            Multiservice · {{ sessionStore.currentCity.name }}
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Información de contacto de los CAI de la Policía Nacional e Inspectores de Policía según tu ciudad.
          </p>
        </div>

        <div class="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
          <MapPin class="w-4 h-4 text-blue-400" />
          <select
            :value="sessionStore.selectedCityId"
            @change="sessionStore.changeCity(($event.target as HTMLSelectElement).value)"
            class="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
          >
            <option
              v-for="city in sessionStore.cities"
              :key="city.id"
              :value="city.id"
              class="bg-slate-900"
            >
              Ciudad: {{ city.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Pestañas: CAI de Policía vs Inspectores de Policía -->
      <div class="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
        <button
          @click="activeTab = 'cais'"
          class="py-2.5 px-4 rounded-lg text-xs font-bold transition cursor-pointer"
          :class="
            activeTab === 'cais'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          "
        >
          🚓 CAI de Policía en {{ sessionStore.currentCity.name }} ({{ multiserviceStore.cityCais.length }})
        </button>

        <button
          @click="activeTab = 'inspectors'"
          class="py-2.5 px-4 rounded-lg text-xs font-bold transition cursor-pointer"
          :class="
            activeTab === 'inspectors'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          "
        >
          🏛️ Inspectores de Policía en {{ sessionStore.currentCity.name }} ({{ multiserviceStore.cityInspections.length }})
        </button>
      </div>

      <!-- LISTA 1: CAI DE LA POLICÍA SEGÚN LA CIUDAD -->
      <div v-if="activeTab === 'cais'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="cai in multiserviceStore.cityCais"
          :key="cai.id"
          class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[11px] font-semibold text-emerald-400 uppercase">
                {{ cai.stationName }} · {{ cai.quadrant }}
              </span>
              <h3 class="text-base font-bold text-white mt-0.5">{{ cai.name }}</h3>
            </div>
            <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              🟢 {{ cai.schedule }}
            </span>
          </div>

          <div class="text-xs text-slate-300 space-y-1">
            <p><strong>Dirección:</strong> {{ cai.address }} ({{ cai.neighborhood }})</p>
            <p><strong>Localidad / Comuna:</strong> {{ cai.district }}</p>
            <p><strong>Teléfono fijo:</strong> {{ cai.phone }}</p>
          </div>

          <div class="flex flex-wrap items-center gap-2 pt-2">
            <a
              :href="`tel:${cai.phone}`"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
            >
              <Phone class="w-3.5 h-3.5" />
              <span>Llamar al CAI</span>
            </a>

            <a
              :href="`https://wa.me/${cai.whatsapp.replace(/\D/g, '')}`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
            >
              <MessageCircle class="w-3.5 h-3.5" />
              <span>WhatsApp Cuadrante</span>
            </a>

            <a
              :href="`https://www.google.com/maps/search/?api=1&query=${cai.lat},${cai.lng}`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
            >
              <Navigation class="w-3.5 h-3.5" />
              <span>Cómo llegar</span>
            </a>
          </div>
        </div>
      </div>

      <!-- LISTA 2: INSPECTORES DE POLICÍA SEGÚN LA CIUDAD -->
      <div v-else class="space-y-4">
        <div
          v-for="insp in multiserviceStore.cityInspections"
          :key="insp.id"
          class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span class="text-xs font-semibold text-blue-400">{{ insp.district }} · {{ insp.cityName }}</span>
              <h3 class="text-base font-bold text-white">{{ insp.name }}</h3>
            </div>
            <span class="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
              <Clock class="w-3.5 h-3.5" /> {{ insp.schedule }}
            </span>
          </div>

          <!-- Tarjeta destacada del Inspector de Policía -->
          <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <UserCheck class="w-5 h-5" />
            </div>
            <div>
              <p class="text-xs text-slate-400">Inspector(a) de Policía a cargo en {{ insp.cityName }}:</p>
              <p class="text-sm font-bold text-white">
                {{ insp.inspectorName }} — <span class="text-blue-300 font-medium">{{ insp.inspectorPosition }}</span>
              </p>
            </div>
          </div>

          <div class="text-xs text-slate-300 space-y-1">
            <p><strong>Dirección del despacho:</strong> {{ insp.address }}</p>
            <p><strong>Competencias legales (Ley 1801 de 2016):</strong> {{ insp.competencies }}</p>
          </div>

          <div class="flex flex-wrap items-center gap-2 pt-1">
            <a
              :href="`tel:${insp.phone}`"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
            >
              <Phone class="w-3.5 h-3.5" />
              <span>Llamar ({{ insp.phone }})</span>
            </a>

            <a
              :href="`mailto:${insp.email}`"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
            >
              <Mail class="w-3.5 h-3.5" />
              <span>{{ insp.email }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>