<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Briefcase,
  MapPin,
  Award,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  UserPlus,
  Search,
} from 'lucide-vue-next'
import { useLawyersStore } from '@/stores/lawyers'
import { useSessionStore } from '@/stores/session'

const lawyersStore = useLawyersStore()
const sessionStore = useSessionStore()

const searchQuery = ref('')
const selectedSpecialty = ref('ALL')
const filterByCurrentCity = ref(false)

const filteredLawyers = computed(() => {
  return lawyersStore.lawyers.filter((item) => {
    if (filterByCurrentCity.value && item.cityId !== sessionStore.selectedCityId) {
      return false
    }
    if (selectedSpecialty.value !== 'ALL' && item.specialtyCode !== selectedSpecialty.value) {
      return false
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      return (
        item.fullName.toLowerCase().includes(q) ||
        item.serviceTitle.toLowerCase().includes(q) ||
        item.serviceDescription.toLowerCase().includes(q) ||
        item.specialtyName.toLowerCase().includes(q)
      )
    }
    return true
  })
})

function buildWhatsAppUrl(whatsapp: string, lawyerName: string, serviceTitle: string) {
  const digits = whatsapp.replace(/\D/g, '')
  const msg = encodeURIComponent(
    `Hola ${lawyerName}, vi tu servicio "${serviceTitle}" publicado en Remi-915 Colombia y deseo consultar contigo.`
  )
  return `https://wa.me/${digits}?text=${msg}`
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6 bg-slate-950">
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Encabezado estilo LinkedIn / Bolsa de Servicios -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div class="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase">
            <Briefcase class="w-4 h-4" />
            <span>Directorio Profesional y Bolsa de Servicios Jurídicos</span>
          </div>
          <h2 class="text-xl font-bold text-white mt-1">Lawyers · Abogados Disponibles</h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Consulta la especialidad, oficios, experiencia e información personal de cada abogado y contáctalo directamente.
          </p>
        </div>

        <button
          @click="sessionStore.openEntryTab('service-register')"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer shrink-0"
        >
          <UserPlus class="w-4 h-4" />
          <span>Publicar mi servicio como Abogado</span>
        </button>
      </div>

      <!-- Barra de Filtros -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/70 border border-slate-800 rounded-xl p-3">
        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por servicio, oficio o nombre..."
            class="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          v-model="selectedSpecialty"
          class="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="ALL">Todas las especialidades</option>
          <option v-for="s in lawyersStore.specialties" :key="s.code" :value="s.code">
            {{ s.name }}
          </option>
        </select>

        <label class="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
          <input v-model="filterByCurrentCity" type="checkbox" class="rounded" />
          <span>Solo en {{ sessionStore.currentCity.name }}</span>
        </label>
      </div>

      <!-- Tarjetas de Abogados y Publicaciones tipo LinkedIn -->
      <div class="space-y-4">
        <div
          v-for="lawyer in filteredLawyers"
          :key="lawyer.id"
          class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition space-y-4"
        >
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div class="flex items-start gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-base shrink-0">
                {{ lawyer.fullName.slice(0, 2).toUpperCase() }}
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-base font-bold text-white">{{ lawyer.fullName }}</h3>
                  <span
                    v-if="lawyer.verificationStatus === 'VERIFIED'"
                    class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  >
                    <CheckCircle2 class="w-3 h-3" /> Verificado SIRNA
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  >
                    <Clock class="w-3 h-3" /> Nuevo registro · Sin verificar
                  </span>
                </div>
                <p class="text-xs text-blue-300 font-medium mt-0.5">{{ lawyer.headline }}</p>
                <div class="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                  <span class="flex items-center gap-1">
                    <MapPin class="w-3.5 h-3.5 text-slate-500" /> {{ lawyer.cityName }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Award class="w-3.5 h-3.5 text-slate-500" /> T.P. {{ lawyer.professionalCard }} · {{ lawyer.university }}
                  </span>
                  <span>{{ lawyer.yearsExperience }} años exp.</span>
                </div>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30">
                {{ lawyer.specialtyName }}
              </span>
              <p class="text-xs text-slate-400 mt-1">
                Desde <strong class="text-white">${{ lawyer.priceFrom.toLocaleString('es-CO') }} COP</strong>
              </p>
            </div>
          </div>

          <!-- Oficio / Servicio Publicado -->
          <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1.5">
            <p class="text-xs font-bold text-amber-300 uppercase tracking-wide">
              📌 Servicio / Oficio que presenta: {{ lawyer.serviceTitle }}
            </p>
            <p class="text-xs text-slate-300 leading-relaxed">
              {{ lawyer.serviceDescription }}
            </p>
            <p class="text-[11px] text-slate-400 pt-1">
              <strong>Información personal y atención:</strong> {{ lawyer.bio }} · <strong>Dirección:</strong> {{ lawyer.officeAddress }} · <strong>Horario:</strong> {{ lawyer.schedule }}
            </p>
          </div>

          <!-- Botones de Contacto Directo (WhatsApp, Llamar, Correo) -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span class="text-[11px] text-slate-500">{{ lawyer.publishedAt }} · Modalidad: {{ lawyer.modality }}</span>

            <div class="flex flex-wrap items-center gap-2">
              <a
                :href="buildWhatsAppUrl(lawyer.whatsapp, lawyer.fullName, lawyer.serviceTitle)"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
              >
                <MessageCircle class="w-3.5 h-3.5" />
                <span>Contactar por WhatsApp</span>
              </a>

              <a
                :href="`tel:${lawyer.phone}`"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
              >
                <Phone class="w-3.5 h-3.5" />
                <span>Llamar ({{ lawyer.phone }})</span>
              </a>

              <a
                :href="`mailto:${lawyer.email}?subject=Consulta Remi-915: ${lawyer.serviceTitle}`"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
              >
                <Mail class="w-3.5 h-3.5" />
                <span>Correo</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>