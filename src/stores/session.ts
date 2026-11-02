import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiRequest } from '@/services/api'

export interface CityOption {
  id: string
  name: string
  department: string
  lat: number
  lng: number
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: 'USER' | 'LAWYER'
  cityId: string
  cityName: string
}

export const CITIES: CityOption[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'Bogotá D.C.',
    department: 'Bogotá D.C.',
    lat: 4.711,
    lng: -74.0721,
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    name: 'Medellín',
    department: 'Antioquia',
    lat: 6.2442,
    lng: -75.5812,
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    name: 'Cali',
    department: 'Valle del Cauca',
    lat: 3.4516,
    lng: -76.532,
  },
]

export const useSessionStore = defineStore('session', () => {
  const user = ref<SessionUser | null>(null)
  const selectedCityId = ref<string>(CITIES[0]!.id)
  const showEntryModal = ref<boolean>(true)
  const entryActiveTab = ref<'user' | 'service-register'>('user')

  const currentCity = computed<CityOption>(() => {
    return CITIES.find((c) => c.id === selectedCityId.value) || CITIES[0]!
  })

  // Verifica si ya hay una sesión activa en la Base de Datos Vectorial (ChromaDB)
  async function checkVectorSession() {
    try {
      const res = await apiRequest<{ user: SessionUser }>('/sessions/current')
      if (res.success && res.data.user) {
        user.value = res.data.user
        selectedCityId.value = res.data.user.cityId || CITIES[0]!.id
        showEntryModal.value = false
      }
    } catch {
      // Si el backend aún no está encendido o no hay sesión, muestra las pestañas centrales
      showEntryModal.value = true
    }
  }

  // Crea o recupera la sesión del usuario (en ChromaDB cuando el backend esté activo, o en memoria mientras tanto)
  async function startUserSession(payload: { name: string; email: string; cityId: string }) {
    selectedCityId.value = payload.cityId
    const cityObj = CITIES.find((c) => c.id === payload.cityId) || CITIES[0]!

    try {
      const res = await apiRequest<{ user: SessionUser }>('/sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      user.value = res.data.user
    } catch {
      // Respaldo inmediato en memoria mientras se levanta el backend
      user.value = {
        id: crypto.randomUUID(),
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        role: 'USER',
        cityId: cityObj.id,
        cityName: cityObj.name,
      }
    }

    showEntryModal.value = false
  }

  async function changeCity(cityId: string) {
    selectedCityId.value = cityId
    const cityObj = CITIES.find((c) => c.id === cityId) ?? CITIES[0]!
    if (user.value) {
      user.value.cityId = cityObj.id
      user.value.cityName = cityObj.name
    }
    try {
      await apiRequest('/sessions/current', {
        method: 'PATCH',
        body: JSON.stringify({ cityId }),
      })
    } catch {
      // Continuar en memoria si el backend aún no está activo
    }
  }

  function openEntryTab(tab: 'user' | 'service-register') {
    entryActiveTab.value = tab
    showEntryModal.value = true
  }

  async function logoutSession() {
    try {
      await apiRequest('/sessions/current', { method: 'DELETE' })
    } catch {
      // Ignorar si backend está apagado
    }
    user.value = null
    entryActiveTab.value = 'user'
    showEntryModal.value = true
  }

  return {
    user,
    selectedCityId,
    currentCity,
    showEntryModal,
    entryActiveTab,
    cities: CITIES,
    checkVectorSession,
    startUserSession,
    changeCity,
    openEntryTab,
    logoutSession,
  }
})