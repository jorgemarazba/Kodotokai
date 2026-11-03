import { defineStore } from 'pinia'
import { ref } from 'vue'

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
  const showEntryModal = ref<boolean>(false)
  const entryActiveTab = ref<'user' | 'service-register'>('user')
  const isMobileSidebarOpen = ref<boolean>(false)
  const showMobileAvatar = ref<boolean>(false)

  function openEntryTab(tab: 'user' | 'service-register') {
    entryActiveTab.value = tab
    showEntryModal.value = true
    isMobileSidebarOpen.value = false
  }

  function toggleMobileSidebar() {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen.value = false
  }

  function toggleMobileAvatar() {
    showMobileAvatar.value = !showMobileAvatar.value
  }

  return {
    user,
    showEntryModal,
    entryActiveTab,
    isMobileSidebarOpen,
    showMobileAvatar,
    openEntryTab,
    toggleMobileSidebar,
    closeMobileSidebar,
    toggleMobileAvatar,
  }
})