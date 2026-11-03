import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  type PqrsdCase,
  type PqrsdCreateInput,
  createPqrsd,
  getPqrsd,
  listPqrsd,
  updatePqrsd,
  addAnexoPqrsd,
  TIPOS_PETICION,
  CANALES_ATENCION,
  DEPENDENCIAS,
} from '@/services/pqrsd'

export const usePqrsdStore = defineStore('pqrsd', () => {
  const currentCase = ref<PqrsdCase | null>(null)
  const recentCases = ref<PqrsdCase[]>([])
  const isLoading = ref<boolean>(false)
  const errorMessage = ref<string>('')
  const successMessage = ref<string>('')

  // Control de modal PQRSD en la UI
  const isPqrsModalOpen = ref<boolean>(false)
  const activeTab = ref<'radicar' | 'consultar' | 'lista'>('radicar')

  function openPqrsModal(tab: 'radicar' | 'consultar' | 'lista' = 'radicar') {
    activeTab.value = tab
    isPqrsModalOpen.value = true
    errorMessage.value = ''
    successMessage.value = ''
  }

  function closePqrsModal() {
    isPqrsModalOpen.value = false
  }

  async function filePqrsd(payload: PqrsdCreateInput): Promise<PqrsdCase> {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    try {
      const newCase = await createPqrsd(payload)
      currentCase.value = newCase
      recentCases.value.unshift(newCase)
      successMessage.value = `¡PQRSD radicado con éxito! Número de radicado: ${newCase.radicado}`
      return newCase
    } catch (err: any) {
      errorMessage.value = err.message || 'Error al radicar el caso'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCaseByRadicado(radicado: string): Promise<PqrsdCase> {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const found = await getPqrsd(radicado)
      currentCase.value = found
      const exists = recentCases.value.some((c) => c.radicado === found.radicado)
      if (!exists) {
        recentCases.value.unshift(found)
      }
      return found
    } catch (err: any) {
      errorMessage.value = err.message || `No se encontró el caso con radicado ${radicado}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function loadRecentList(): Promise<PqrsdCase[]> {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const cases = await listPqrsd({ limit: 20 })
      recentCases.value = cases
      return cases
    } catch (err: any) {
      errorMessage.value = err.message || 'Error al cargar lista de PQRSD'
      return []
    } finally {
      isLoading.value = false
    }
  }

  return {
    currentCase,
    recentCases,
    isLoading,
    errorMessage,
    successMessage,
    isPqrsModalOpen,
    activeTab,
    openPqrsModal,
    closePqrsModal,
    filePqrsd,
    fetchCaseByRadicado,
    loadRecentList,
    tiposPeticion: TIPOS_PETICION,
    canalesAtencion: CANALES_ATENCION,
    dependencias: DEPENDENCIAS,
  }
})
