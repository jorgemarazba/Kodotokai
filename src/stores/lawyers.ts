import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiRequest } from '@/services/api'
import { CITIES } from './session'

export interface LawyerServiceItem {
  id: string
  lawyerId: string
  fullName: string
  headline: string
  bio: string
  cityId: string
  cityName: string
  specialtyCode: string
  specialtyName: string
  professionalCard: string
  university: string
  yearsExperience: number
  modality: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDO'
  verificationStatus: 'VERIFIED' | 'UNVERIFIED'
  serviceTitle: string
  serviceDescription: string
  priceFrom: number
  priceTo?: number
  whatsapp: string
  phone: string
  email: string
  officeAddress: string
  schedule: string
  publishedAt: string
}

export const SPECIALTIES = [
  { code: 'LABORAL', name: 'Derecho Laboral y Seguridad Social' },
  { code: 'CIVIL', name: 'Derecho Civil y Contratos' },
  { code: 'FAMILIA', name: 'Derecho de Familia y Sucesiones' },
  { code: 'PENAL', name: 'Derecho Penal y Defensa' },
  { code: 'COMERCIAL', name: 'Derecho Comercial y Societario' },
  { code: 'CONSUMIDOR', name: 'Protección al Consumidor (SIC)' },
  { code: 'INMOBILIARIO', name: 'Derecho Inmobiliario y Arrendamientos' },
]

export const useLawyersStore = defineStore('lawyers', () => {
  const lawyers = ref<LawyerServiceItem[]>([
    {
      id: 'post-bog-1',
      lawyerId: 'law-bog-1',
      fullName: 'Dra. Laura Méndez Restrepo',
      headline: 'Especialista en Derecho Laboral y Seguridad Social · 12 años de experiencia',
      bio: 'Abogada de la Universidad Nacional de Colombia. Especialista en despidos sin justa causa, liquidación de prestaciones sociales, fuero de maternidad y pensiones.',
      cityId: CITIES[0]!.id,
      cityName: 'Bogotá D.C.',
      specialtyCode: 'LABORAL',
      specialtyName: 'Derecho Laboral y Seguridad Social',
      professionalCard: 'TP-214890-CSJ',
      university: 'Universidad Nacional de Colombia',
      yearsExperience: 12,
      modality: 'HIBRIDO',
      verificationStatus: 'VERIFIED',
      serviceTitle: 'Demanda y Conciliación por Despido sin Justa Causa y Liquidación',
      serviceDescription:
        'Reviso tu contrato, calculo exactamente tu liquidación e indemnización (Arts. 64 y 65 CST), redacto la reclamación formal y te represento ante el Ministerio del Trabajo o juzgado laboral.',
      priceFrom: 120000,
      priceTo: 450000,
      whatsapp: '+573104567890',
      phone: '+576013456789',
      email: 'laura.mendez@abogadosbogota.co',
      officeAddress: 'Calle 72 # 10-07 Of. 402, Chapinero, Bogotá D.C.',
      schedule: 'Lun - Vie: 8:00 a.m. - 6:00 p.m.',
      publishedAt: 'Hace 2 días',
    },
    {
      id: 'post-med-1',
      lawyerId: 'law-med-1',
      fullName: 'Dr. Andrés Felipe Gómez Ochoa',
      headline: 'Abogado Inmobiliario, Civil y Comercial · Contratos y Arrendamientos',
      bio: 'Egresado de la Universidad de Antioquia, magíster en Derecho Privado. Asesoro propietarios, inquilinos y empresas en contratos de arrendamiento (Ley 820 de 2003) y restitución de inmueble.',
      cityId: CITIES[1]!.id,
      cityName: 'Medellín',
      specialtyCode: 'INMOBILIARIO',
      specialtyName: 'Derecho Inmobiliario y Arrendamientos',
      professionalCard: 'TP-289310-CSJ',
      university: 'Universidad de Antioquia',
      yearsExperience: 9,
      modality: 'HIBRIDO',
      verificationStatus: 'VERIFIED',
      serviceTitle: 'Elaboración de Contratos de Arrendamiento y Restitución de Inmueble',
      serviceDescription:
        'Redacción y revisión de contratos de vivienda urbana y locales comerciales, cobro de cánones en mora y procesos de restitución.',
      priceFrom: 100000,
      priceTo: 350000,
      whatsapp: '+573147891234',
      phone: '+576042689000',
      email: 'andres.gomez@juridicamedellin.co',
      officeAddress: 'Cra. 43A # 1-50 Of. 605, El Poblado, Medellín',
      schedule: 'Lun - Vie: 8:00 a.m. - 5:30 p.m.',
      publishedAt: 'Hace 3 días',
    },
    {
      id: 'post-cal-1',
      lawyerId: 'law-cal-1',
      fullName: 'Dra. Camila Valencia Caicedo',
      headline: 'Abogada de Familia, Sucesiones y Protección al Consumidor (SIC)',
      bio: 'Abogada de la Universidad del Valle. Especialista en divorcios de mutuo acuerdo, fijación de cuota alimentaria, sucesiones y demandas ante la SIC.',
      cityId: CITIES[2]!.id,
      cityName: 'Cali',
      specialtyCode: 'FAMILIA',
      specialtyName: 'Derecho de Familia y Sucesiones',
      professionalCard: 'TP-312045-CSJ',
      university: 'Universidad del Valle',
      yearsExperience: 7,
      modality: 'HIBRIDO',
      verificationStatus: 'VERIFIED',
      serviceTitle: 'Divorcio Express en Notaría, Sucesiones y Cuota Alimentaria',
      serviceDescription:
        'Trámite ágil de divorcio por mutuo acuerdo, liquidación de sociedad conyugal y demandas de protección al consumidor ante la SIC.',
      priceFrom: 150000,
      priceTo: 500000,
      whatsapp: '+573169012345',
      phone: '+576026612345',
      email: 'camila.valencia@defensacali.co',
      officeAddress: 'Av. 6N # 25N-42, Santa Mónica, Cali',
      schedule: 'Lun - Vie: 8:30 a.m. - 6:00 p.m.',
      publishedAt: 'Hace 1 día',
    },
  ])

  async function fetchLawyers() {
    try {
      const res = await apiRequest<LawyerServiceItem[]>('/lawyers')
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        lawyers.value = res.data
      }
    } catch {
      // Mantiene los datos iniciales si el backend aún no está encendido
    }
  }

  // Registra un nuevo abogado desde la pestaña central "Registro de servicio" y lo publica en Lawyers
  async function registerLawyerService(payload: Omit<LawyerServiceItem, 'id' | 'lawyerId' | 'verificationStatus' | 'publishedAt' | 'cityName' | 'specialtyName'>) {
    const cityObj = CITIES.find((c) => c.id === payload.cityId) || CITIES[0]!
    const specObj = SPECIALTIES.find((s) => s.code === payload.specialtyCode) ?? SPECIALTIES[0]!

    const newEntry: LawyerServiceItem = {
      ...payload,
      id: crypto.randomUUID(),
      lawyerId: crypto.randomUUID(),
      cityName: cityObj.name,
      specialtyName: specObj.name,
      verificationStatus: 'UNVERIFIED',
      publishedAt: 'Publicado ahora mismo',
    }

    try {
      const res = await apiRequest<LawyerServiceItem>('/lawyers/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (res.success && res.data) {
        lawyers.value.unshift(res.data)
        return res.data
      }
    } catch {
      // Lo agrega inmediatamente en memoria para que aparezca en Lawyers del sidebar
    }

    lawyers.value.unshift(newEntry)
    return newEntry
  }

  return {
    lawyers,
    specialties: SPECIALTIES,
    fetchLawyers,
    registerLawyerService,
  }
})