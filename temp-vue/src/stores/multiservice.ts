import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CITIES, useSessionStore } from './session'

export interface CaiItem {
  id: string
  cityId: string
  cityName: string
  name: string
  stationName: string
  address: string
  neighborhood: string
  district: string
  quadrant: string
  lat: number
  lng: number
  phone: string
  whatsapp: string
  schedule: string
}

export interface PoliceInspectionItem {
  id: string
  cityId: string
  cityName: string
  name: string
  inspectorName: string
  inspectorPosition: string
  address: string
  district: string
  lat: number
  lng: number
  phone: string
  email: string
  schedule: string
  competencies: string
}

export const useMultiserviceStore = defineStore('multiservice', () => {
  const sessionStore = useSessionStore()

  const allCais = ref<CaiItem[]>([
    // BOGOTÁ D.C.
    {
      id: 'cai-bog-1',
      cityId: CITIES[0]!.id,
      cityName: 'Bogotá D.C.',
      name: 'CAI Chapinero (Parque Lourdes)',
      stationName: 'Estación E-2 Chapinero',
      address: 'Calle 63 con Carrera 13',
      neighborhood: 'Chapinero Central',
      district: 'Localidad 02 - Chapinero',
      quadrant: 'Cuadrantes 12, 13 y 14',
      lat: 4.6486,
      lng: -74.0628,
      phone: '+576012496112',
      whatsapp: '+573002011214',
      schedule: '24 horas',
    },
    {
      id: 'cai-bog-2',
      cityId: CITIES[0]!.id,
      cityName: 'Bogotá D.C.',
      name: 'CAI Virrey',
      stationName: 'Estación E-2 Chapinero',
      address: 'Carrera 15 con Calle 87 (Parque El Virrey)',
      neighborhood: 'El Chicó',
      district: 'Localidad 02 - Chapinero',
      quadrant: 'Cuadrantes 21 y 22',
      lat: 4.6728,
      lng: -74.0545,
      phone: '+576012364510',
      whatsapp: '+573002012122',
      schedule: '24 horas',
    },
    {
      id: 'cai-bog-3',
      cityId: CITIES[0]!.id,
      cityName: 'Bogotá D.C.',
      name: 'CAI Unicentro',
      stationName: 'Estación E-1 Usaquén',
      address: 'Carrera 15 # 124-30',
      neighborhood: 'Santa Bárbara',
      district: 'Localidad 01 - Usaquén',
      quadrant: 'Cuadrantes 5 y 6',
      lat: 4.7019,
      lng: -74.0422,
      phone: '+576012138820',
      whatsapp: '+573002010506',
      schedule: '24 horas',
    },
    // MEDELLÍN
    {
      id: 'cai-med-1',
      cityId: CITIES[1]!.id,
      cityName: 'Medellín',
      name: 'CAI Parque El Poblado',
      stationName: 'Estación El Poblado (MEVAL)',
      address: 'Calle 9 con Carrera 43A',
      neighborhood: 'El Poblado',
      district: 'Comuna 14 - El Poblado',
      quadrant: 'Cuadrante 14-03',
      lat: 6.2105,
      lng: -75.5702,
      phone: '+576042660912',
      whatsapp: '+573046281403',
      schedule: '24 horas',
    },
    {
      id: 'cai-med-2',
      cityId: CITIES[1]!.id,
      cityName: 'Medellín',
      name: 'CAI Segundo Parque de Laureles',
      stationName: 'Estación Laureles (MEVAL)',
      address: 'Circular 1 con Av. Nutibara',
      neighborhood: 'Laureles',
      district: 'Comuna 11 - Laureles Estadio',
      quadrant: 'Cuadrante 11-08',
      lat: 6.2458,
      lng: -75.5964,
      phone: '+576044112233',
      whatsapp: '+573046281108',
      schedule: '24 horas',
    },
    // CALI
    {
      id: 'cai-cal-1',
      cityId: CITIES[2]!.id,
      cityName: 'Cali',
      name: 'CAI Panamericano / San Fernando',
      stationName: 'Estación El Lido (MECAL)',
      address: 'Calle 5 con Carrera 36',
      neighborhood: 'San Fernando',
      district: 'Comuna 19',
      quadrant: 'Cuadrante 19-04',
      lat: 3.4312,
      lng: -76.5441,
      phone: '+576025561890',
      whatsapp: '+573117491904',
      schedule: '24 horas',
    },
    {
      id: 'cai-cal-2',
      cityId: CITIES[2]!.id,
      cityName: 'Cali',
      name: 'CAI Chipichape / Granada',
      stationName: 'Estación La Flora (MECAL)',
      address: 'Avenida 6N con Calle 36N',
      neighborhood: 'Chipichape',
      district: 'Comuna 2',
      quadrant: 'Cuadrante 02-07',
      lat: 3.4741,
      lng: -76.5284,
      phone: '+576026641122',
      whatsapp: '+573117490207',
      schedule: '24 horas',
    },
  ])

  const allInspections = ref<PoliceInspectionItem[]>([
    // BOGOTÁ D.C.
    {
      id: 'insp-bog-1',
      cityId: CITIES[0]!.id,
      cityName: 'Bogotá D.C.',
      name: 'Inspección 2A Distrital de Policía — Chapinero',
      inspectorName: 'Dr. Carlos Eduardo Ruiz Santamaría',
      inspectorPosition: 'Inspector 2A Distrital de Policía',
      address: 'Carrera 13 # 54-74 Piso 2 (Alcaldía Local de Chapinero)',
      district: 'Localidad 02 - Chapinero',
      lat: 4.6418,
      lng: -74.0639,
      phone: '+576013486200',
      email: 'inspeccion.chapinero@gobiernobogota.gov.co',
      schedule: 'Lun a Vie: 7:00 a.m. - 4:30 p.m.',
      competencies:
        'Querellas policivas por perturbación a la posesión, ruidos molestos, conflictos vecinales, mascotas y apelación de comparendos (Ley 1801 de 2016).',
    },
    {
      id: 'insp-bog-2',
      cityId: CITIES[0]!.id,
      cityName: 'Bogotá D.C.',
      name: 'Inspección 1B Distrital de Policía — Usaquén',
      inspectorName: 'Dra. Marcela Patricia Ospina Gómez',
      inspectorPosition: 'Inspectora 1B Distrital de Policía',
      address: 'Carrera 6A # 118-03 (Casa de Gobierno Usaquén)',
      district: 'Localidad 01 - Usaquén',
      lat: 4.6952,
      lng: -74.0311,
      phone: '+576016195088',
      email: 'inspeccion.usaquen@gobiernobogota.gov.co',
      schedule: 'Lun a Vie: 7:00 a.m. - 4:30 p.m.',
      competencies:
        'Comportamientos contrarios a la convivencia, control urbanístico local, espacio público y mediación policiva (Ley 1801 de 2016).',
    },
    // MEDELLÍN
    {
      id: 'insp-med-1',
      cityId: CITIES[1]!.id,
      cityName: 'Medellín',
      name: 'Inspección 14A de Policía Urbana — El Poblado',
      inspectorName: 'Dr. Jorge Iván Montoya Salazar',
      inspectorPosition: 'Inspector 14A de Policía Urbana de Primera Categoría',
      address: 'Carrera 43D # 11-02 (Centro Administrativo El Poblado)',
      district: 'Comuna 14 - El Poblado',
      lat: 6.2124,
      lng: -75.5681,
      phone: '+576043855555',
      email: 'inspeccion14a@medellin.gov.co',
      schedule: 'Lun a Vie: 7:30 a.m. - 5:00 p.m.',
      competencies:
        'Procesos verbales abreviados de policía, querellas por perturbación de posesión o servidumbre, convivencia en propiedad horizontal y comparendos.',
    },
    // CALI
    {
      id: 'insp-cal-1',
      cityId: CITIES[2]!.id,
      cityName: 'Cali',
      name: 'Inspección de Policía Urbana Categoría Especial — Comuna 19 (San Fernando)',
      inspectorName: 'Dra. Diana Carolina Perea Sinisterra',
      inspectorPosition: 'Inspectora de Policía Urbana Comuna 19',
      address: 'Calle 14 # 50-12 (Casa de Justicia / C.A.L.I. 19)',
      district: 'Comuna 19 - San Fernando',
      lat: 3.4189,
      lng: -76.5405,
      phone: '+576028891155',
      email: 'inspeccion.comuna19@cali.gov.co',
      schedule: 'Lun a Vie: 8:00 a.m. - 5:00 p.m.',
      competencies:
        'Conciliación y fallo en querellas civiles de policía, control de ruidos molestos, espacio público y medidas correctivas de la Ley 1801 de 2016.',
    },
  ])

  const cityCais = computed(() =>
    allCais.value.filter((c) => c.cityId === sessionStore.selectedCityId)
  )

  const cityInspections = computed(() =>
    allInspections.value.filter((i) => i.cityId === sessionStore.selectedCityId)
  )

  return {
    allCais,
    allInspections,
    cityCais,
    cityInspections,
  }
})