<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, Sparkles, X } from 'lucide-vue-next'
import { useSessionStore, CITIES } from '@/stores/session'
import { useLawyersStore } from '@/stores/lawyers'

const router = useRouter()
const sessionStore = useSessionStore()
const lawyersStore = useLawyersStore()

// Estado formulario: Registro de Servicio (Abogado)
const lawyerForm = ref({
  fullName: '',
  email: '',
  whatsapp: '+57',
  phone: '',
  cityId: CITIES[0]!.id,
  specialtyCode: 'LABORAL',
  professionalCard: '',
  university: '',
  yearsExperience: 3,
  modality: 'HIBRIDO' as 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDO',
  headline: '',
  bio: '',
  serviceTitle: '',
  serviceDescription: '',
  priceFrom: 100000,
  priceTo: 350000,
  officeAddress: '',
  schedule: 'Lun - Vie: 8:00 a.m. - 6:00 p.m.',
  consent: true,
})
const lawyerError = ref('')

async function handleLawyerRegister() {
  lawyerError.value = ''
  const f = lawyerForm.value
  if (!f.fullName.trim() || !f.email.includes('@') || !f.professionalCard.trim() || !f.serviceTitle.trim()) {
    lawyerError.value = 'Por favor completa tu nombre, correo, tarjeta profesional y el oficio/servicio que ofreces.'
    return
  }
  if (!f.consent) {
    lawyerError.value = 'Debes aceptar la autorización de publicación de datos profesionales.'
    return
  }


  await lawyersStore.registerLawyerService({
    fullName: f.fullName,
    headline: f.headline || `Especialista en ${f.specialtyCode} · ${f.yearsExperience} años de experiencia`,
    bio: f.bio || `Abogado(a) egresado(a) de ${f.university || 'Universidad acreditada'}.`,
    cityId: f.cityId,
    specialtyCode: f.specialtyCode,
    professionalCard: f.professionalCard,
    university: f.university || 'Universidad de Colombia',
    yearsExperience: Number(f.yearsExperience) || 1,
    modality: f.modality,
    serviceTitle: f.serviceTitle,
    serviceDescription: f.serviceDescription || f.serviceTitle,
    priceFrom: Number(f.priceFrom) || 80000,
    priceTo: Number(f.priceTo) || 250000,
    whatsapp: f.whatsapp,
    phone: f.phone || f.whatsapp,
    email: f.email,
    officeAddress: f.officeAddress || 'Atención virtual y presencial con cita previa',
    schedule: f.schedule,
  })

  sessionStore.showEntryModal = false
  router.push('/lawyers')
}
</script>

<template>
  <div
    v-if="sessionStore.showEntryModal"
    class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
  >
    <div class="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
      <!-- Encabezado y Pestañas Centrales -->
      <div class="p-6 border-b border-slate-800 bg-slate-900/60 relative">
        <button
          @click="sessionStore.showEntryModal = false"
          class="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles class="w-4 h-4" />
          <span>Plataforma Jurídica Inteligente · Colombia</span>
        </div>
        <h2 class="text-xl font-bold text-white">Bienvenido a Remi-915</h2>
        <p class="text-xs text-slate-400 mt-1">
          Si eres abogado(a), publica tus servicios para que aparezcas en la sección Lawyers.
        </p>

      </div>

      <!-- CONTENIDO PESTAÑA 2: REGISTRO DE SERVICIO (ABOGADOS) -->
      <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
          <p class="font-bold text-amber-300 flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4" />
            ¿Para qué sirve esta pestaña de Registro de servicio?
          </p>
          <p class="text-slate-300 leading-relaxed">
            Esta sección es nuestra <strong>bolsa de servicios y reclutamiento de abogados</strong> (estilo LinkedIn). Si eres abogado(a), registra aquí tus datos personales, especialidad y los oficios o servicios que prestas. Al guardar, <strong>tu perfil aparecerá inmediatamente en la sección "Lawyers" de la barra lateral</strong> con botones directos a tu WhatsApp, teléfono y correo para que los usuarios te contacten.
          </p>
        </div>

        <div v-if="lawyerError" class="p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-xs text-red-300">
          {{ lawyerError }}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-300 mb-1">Nombre completo del Abogado(a) *</label>
            <input
              v-model="lawyerForm.fullName"
              type="text"
              placeholder="Ej. Dr. Carlos Andrés Ruiz"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">Tarjeta Profesional (CSJ) *</label>
            <input
              v-model="lawyerForm.professionalCard"
              type="text"
              placeholder="Ej. TP-349120-CSJ"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">Ciudad donde ejerces *</label>
            <select
              v-model="lawyerForm.cityId"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
            >
              <option v-for="c in CITIES" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">Especialidad Principal *</label>
            <select
              v-model="lawyerForm.specialtyCode"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
            >
              <option v-for="s in lawyersStore.specialties" :key="s.code" :value="s.code">
                {{ s.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">WhatsApp de contacto *</label>
            <input
              v-model="lawyerForm.whatsapp"
              type="text"
              placeholder="+573101234567"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">Correo profesional *</label>
            <input
              v-model="lawyerForm.email"
              type="email"
              placeholder="abogado@firma.co"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">Universidad de egreso</label>
            <input
              v-model="lawyerForm.university"
              type="text"
              placeholder="Ej. Universidad Externado / Nacional"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">Años de experiencia</label>
            <input
              v-model="lawyerForm.yearsExperience"
              type="number"
              min="0"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs text-slate-300 mb-1">
            Título del Oficio o Servicio Jurídico que ofreces (como publicación de empleo) *
          </label>
          <input
            v-model="lawyerForm.serviceTitle"
            type="text"
            placeholder="Ej. Representación en Demandas Laborales, Liquidaciones y Pensiones"
            class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
          />
        </div>

        <div>
          <label class="block text-xs text-slate-300 mb-1">
            Descripción detallada de tus servicios e información personal *
          </label>
          <textarea
            v-model="lawyerForm.serviceDescription"
            rows="3"
            placeholder="Describe qué incluye tu asesoría, experiencia personal, horarios y cómo ayudas al cliente..."
            class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-300 mb-1">Tarifa base desde (COP)</label>
            <input
              v-model="lawyerForm.priceFrom"
              type="number"
              step="10000"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">Dirección de oficina / Modalidad</label>
            <input
              v-model="lawyerForm.officeAddress"
              type="text"
              placeholder="Ej. Cra 7 # 71-21 Bogotá / Virtual"
              class="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input v-model="lawyerForm.consent" type="checkbox" class="rounded border-slate-700" />
          <span>Autorizo publicar mis datos profesionales de contacto en la sección Lawyers (Ley 1581 de 2012).</span>
        </label>

        <button
          @click="handleLawyerRegister"
          class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          Publicar mi Servicio y Agregarme a Lawyers
        </button>
      </div>
    </div>
  </div>
</template>
