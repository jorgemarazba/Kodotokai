import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface TranslogixService {
  id: string
  code: string
  title: string
  shortTitle: string
  category: 'TRANSPORTE' | 'ULTIMA_MILLA' | 'ESPECIALIZADO' | 'LOGISTICA'
  badge: string
  description: string
  features: string[]
  equipment: string
  sla: string
  icon: string
}

export interface RouteTariff {
  code: string
  originCity: string
  originDept: string
  destCity: string
  destDept: string
  coverageType: string
  baseKgReal: number
  baseKgVol: number
  divFactorVol: number
  minFreight: number
  insurancePct: number
  minInsurance: number
  coldChainPct: number
  dangerousCargoSurcharge: number
  estimatedHours: number
  notes: string
}

export interface MunicipalityCoverage {
  daneCode: string
  municipality: string
  department: string
  coverageType: string
  standardHours: number
  sameDay: boolean
  refrigerated: boolean
  maxWeightKg: number
  maxVolumeM3: number
  assignedHub: string
  dispatchFrequency: string
  restrictions: string
}

export interface DangerousGoodClass {
  classNumber: string
  name: string
  status: 'ACEPTADO' | 'RESTRINGIDO' | 'PROHIBIDO'
  description: string
  policy: string
  packingAdvice: string
}

export const TRANSLOGIX_SERVICES: TranslogixService[] = [
  {
    id: 'srv-ftl-ltl',
    code: 'FTL_LTL',
    title: 'Transporte de Carga Masiva y Semimasiva (FTL / LTL)',
    shortTitle: 'Carga Masiva FTL/LTL',
    category: 'TRANSPORTE',
    badge: 'Flota Pesada S3/C3',
    description:
      'Movilización intermunicipal de contenedores marítimos (20 y 40 pies) y carga suelta paletizada de gran tonelaje por los principales corredores viales de Colombia.',
    features: [
      'Precintado de seguridad con sellos aduaneros homologados',
      'Póliza de seguro contractual y extracontractual por trayecto',
      'Monitoreo satelital GPS 24/7 integrado al centro de control',
      'Capacidad hasta 35 toneladas por tractocamión',
    ],
    equipment: '120 Tractocamiones S3 y 180 Camiones C2/C3',
    sla: '24 a 48 horas interurbano',
    icon: 'Truck',
  },
  {
    id: 'srv-paqueteria',
    code: 'ULTIMA_MILLA',
    title: 'Paquetería Empresarial y Mensajería Exprés (Última Milla)',
    shortTitle: 'Paquetería & Same Day',
    category: 'ULTIMA_MILLA',
    badge: 'Same Day Disponible',
    description:
      'Despacho rápido de sobres, documentos, muestras comerciales y paquetes de hasta 50 kg con entregas puerta a puerta en más de 650 municipios.',
    features: [
      'Servicio Same Day (mismo día) en Bogotá, Medellín y Cali',
      'Trazabilidad en tiempo real y prueba de entrega digital (POD con firma)',
      'Tarifa base optimizada con báscula calibrada y cubicaje volumétrico',
      'Recolección prioritaria en centros de distribución y oficinas',
    ],
    equipment: '130 Turbos y Vans de Última Milla',
    sla: '24 horas principales ciudades / Mismo día urbano',
    icon: 'Package',
  },
  {
    id: 'srv-cadena-frio',
    code: 'CADENA_FRIO',
    title: 'Transporte con Cadena de Frío Certificada (-20°C a 8°C)',
    shortTitle: 'Cadena de Frío',
    category: 'ESPECIALIZADO',
    badge: 'Control -20°C a 8°C',
    description:
      'Flota termo-refrigerada con termógrafos digitales para el transporte de medicamentos, vacunas, muestras biológicas y alimentos perecederos con reporte de temperatura en tiempo real.',
    features: [
      'Monitoreo telemático de temperatura cada 60 segundos con alertas de desviación',
      'Neveras termoaislantes industriales y acumuladores gelificados a -18°C',
      'Certificación Buenas Prácticas de Transporte (BPT) del Invima',
      'Protocolos de contingencia y unidades de respaldo térmico',
    ],
    equipment: '50 Furgones Termo con equipos Thermo King / Carrier',
    sla: '24 a 48 horas continuas garantizadas',
    icon: 'Thermometer',
  },
  {
    id: 'srv-fulfillment',
    code: 'FULFILLMENT',
    title: 'Almacenamiento, WMS y Fulfillment e-Commerce',
    shortTitle: 'Fulfillment & WMS',
    category: 'LOGISTICA',
    badge: 'Zona Franca Fontibón',
    description:
      'Gestión integral de inventarios en bodegas con temperatura controlada en Zona Franca Fontibón y Hubs regionales con integración a tiendas online.',
    features: [
      'Integración API directa con Shopify, WooCommerce y VTEX',
      'Procesamiento automatizado de órdenes: Pick & Pack y etiquetado',
      'Almacenamiento fiscal y aduanero con exención de aranceles temporales',
      'Control de inventario en tiempo real con sistema WMS corporativo',
    ],
    equipment: '4 Hubs logísticos (Fontibón, Rionegro, Yumbo, Malambo)',
    sla: 'Despacho el mismo día si la orden entra antes de 12:00 PM',
    icon: 'Layers',
  },
  {
    id: 'srv-logistica-inversa',
    code: 'LOGISTICA_INVERSA',
    title: 'Logística Inversa y Gestión de Devoluciones',
    shortTitle: 'Logística Inversa',
    category: 'LOGISTICA',
    badge: 'Inspección de Calidad',
    description:
      'Solución integral para retorno de productos no conformes, garantías, cambios en comercio electrónico y recolección de envases o residuos reciclables.',
    features: [
      'Recolección programada en punto de venta o domicilio del cliente',
      'Inspección visual del estado del embalaje con registro fotográfico',
      'Re-empaque y consolidación para devolución a bodega matriz',
      'Gestión ágil para cumplimiento del Estatuto del Consumidor (Ley 1480 de 2011)',
    ],
    equipment: 'Red nacional de 480 vehículos integrados',
    sla: '48 a 72 horas para retorno consolidado',
    icon: 'RotateCcw',
  },
]

export const ROUTE_TARIFFS: RouteTariff[] = [
  {
    code: 'TLX-BOG-MED-001',
    originCity: 'Bogotá D.C.',
    originDept: 'Cundinamarca',
    destCity: 'Medellín',
    destDept: 'Antioquia',
    coverageType: 'Urbana Principal',
    baseKgReal: 1450,
    baseKgVol: 1600,
    divFactorVol: 4000,
    minFreight: 18500,
    insurancePct: 1.0,
    minInsurance: 3500,
    coldChainPct: 25.0,
    dangerousCargoSurcharge: 45000,
    estimatedHours: 24,
    notes: 'Ruta de alto flujo por Corredor Bogotá-Medellín. Admite Same Day si se despacha antes de las 09:00 AM.',
  },
  {
    code: 'TLX-BOG-CLO-002',
    originCity: 'Bogotá D.C.',
    originDept: 'Cundinamarca',
    destCity: 'Cali',
    destDept: 'Valle del Cauca',
    coverageType: 'Urbana Principal',
    baseKgReal: 1500,
    baseKgVol: 1650,
    divFactorVol: 4000,
    minFreight: 19000,
    insurancePct: 1.0,
    minInsurance: 3500,
    coldChainPct: 25.0,
    dangerousCargoSurcharge: 45000,
    estimatedHours: 24,
    notes: 'Tránsito continuo vía La Línea. Monitoreo satelital 24/7 en paso de montaña.',
  },
  {
    code: 'TLX-BOG-BAQ-003',
    originCity: 'Bogotá D.C.',
    originDept: 'Cundinamarca',
    destCity: 'Barranquilla',
    destDept: 'Atlántico',
    coverageType: 'Urbana Principal',
    baseKgReal: 1850,
    baseKgVol: 2050,
    divFactorVol: 4000,
    minFreight: 22000,
    insurancePct: 1.0,
    minInsurance: 4000,
    coldChainPct: 25.0,
    dangerousCargoSurcharge: 50000,
    estimatedHours: 48,
    notes: 'Troncal del Magdalena / Ruta del Sol. Monitoreo constante de temperatura por clima cálido.',
  },
  {
    code: 'TLX-BOG-CTG-004',
    originCity: 'Bogotá D.C.',
    originDept: 'Cundinamarca',
    destCity: 'Cartagena',
    destDept: 'Bolívar',
    coverageType: 'Urbana Principal',
    baseKgReal: 1900,
    baseKgVol: 2100,
    divFactorVol: 4000,
    minFreight: 23000,
    insurancePct: 1.0,
    minInsurance: 4000,
    coldChainPct: 25.0,
    dangerousCargoSurcharge: 50000,
    estimatedHours: 48,
    notes: 'Servicio directo a Zona Franca Mamonal y bodegas urbanas.',
  },
  {
    code: 'TLX-BOG-BGA-005',
    originCity: 'Bogotá D.C.',
    originDept: 'Cundinamarca',
    destCity: 'Bucaramanga',
    destDept: 'Santander',
    coverageType: 'Urbana Principal',
    baseKgReal: 1400,
    baseKgVol: 1550,
    divFactorVol: 4000,
    minFreight: 17500,
    insurancePct: 1.0,
    minInsurance: 3500,
    coldChainPct: 25.0,
    dangerousCargoSurcharge: 45000,
    estimatedHours: 24,
    notes: 'Ruta activa por Cañón del Chicamocha / Barbosa. Salidas diarias nocturnas.',
  },
  {
    code: 'TLX-BOG-PEI-006',
    originCity: 'Bogotá D.C.',
    originDept: 'Cundinamarca',
    destCity: 'Pereira',
    destDept: 'Risaralda',
    coverageType: 'Urbana Principal',
    baseKgReal: 1420,
    baseKgVol: 1580,
    divFactorVol: 4000,
    minFreight: 18000,
    insurancePct: 1.0,
    minInsurance: 3500,
    coldChainPct: 25.0,
    dangerousCargoSurcharge: 45000,
    estimatedHours: 24,
    notes: 'Eje Cafetero Hub Dosquebradas con distribución regional a Manizales y Armenia.',
  },
  {
    code: 'TLX-BOG-CUC-007',
    originCity: 'Bogotá D.C.',
    originDept: 'Cundinamarca',
    destCity: 'Cúcuta',
    destDept: 'Norte de Santander',
    coverageType: 'Frontera',
    baseKgReal: 2100,
    baseKgVol: 2300,
    divFactorVol: 4000,
    minFreight: 25000,
    insurancePct: 1.0,
    minInsurance: 4500,
    coldChainPct: 30.0,
    dangerousCargoSurcharge: 60000,
    estimatedHours: 48,
    notes: 'Zona fronteriza. Requiere manifiesto de carga detallado para inspecciones DIAN/Polfa.',
  },
  {
    code: 'TLX-BOG-PSO-008',
    originCity: 'Bogotá D.C.',
    originDept: 'Cundinamarca',
    destCity: 'Pasto',
    destDept: 'Nariño',
    coverageType: 'Frontera',
    baseKgReal: 2250,
    baseKgVol: 2450,
    divFactorVol: 4000,
    minFreight: 26000,
    insurancePct: 1.0,
    minInsurance: 4500,
    coldChainPct: 30.0,
    dangerousCargoSurcharge: 60000,
    estimatedHours: 72,
    notes: 'Corredor Sur. Restricciones frecuentes por paso de montaña en vía Panamericana.',
  },
  {
    code: 'TLX-BOG-IPI-009',
    originCity: 'Bogotá D.C.',
    originDept: 'Cundinamarca',
    destCity: 'Ipiales',
    destDept: 'Nariño',
    coverageType: 'Frontera',
    baseKgReal: 2400,
    baseKgVol: 2600,
    divFactorVol: 4000,
    minFreight: 28000,
    insurancePct: 1.0,
    minInsurance: 5000,
    coldChainPct: 30.0,
    dangerousCargoSurcharge: 65000,
    estimatedHours: 72,
    notes: 'Punto fronterizo Rumichaca (Colombia-Ecuador). Exige declaración de tránsito internacional si aplica.',
  },
  {
    code: 'TLX-BOG-VVC-010',
    originCity: 'Bogotá D.C.',
    originDept: 'Cundinamarca',
    destCity: 'Villavicencio',
    destDept: 'Meta',
    coverageType: 'Urbana Principal',
    baseKgReal: 1350,
    baseKgVol: 1500,
    divFactorVol: 4000,
    minFreight: 16500,
    insurancePct: 1.0,
    minInsurance: 3500,
    coldChainPct: 25.0,
    dangerousCargoSurcharge: 40000,
    estimatedHours: 24,
    notes: 'Puerta a los Llanos Orientales. Monitoreo vial por novedades en la Vía al Llano.',
  },
  {
    code: 'TLX-CLO-BUN-015',
    originCity: 'Cali',
    originDept: 'Valle del Cauca',
    destCity: 'Buenaventura',
    destDept: 'Valle del Cauca',
    coverageType: 'Trayecto Especial',
    baseKgReal: 1300,
    baseKgVol: 1450,
    divFactorVol: 4000,
    minFreight: 17000,
    insurancePct: 1.0,
    minInsurance: 3500,
    coldChainPct: 25.0,
    dangerousCargoSurcharge: 55000,
    estimatedHours: 24,
    notes: 'Corredor Portuario. Manejo de carga de importación/exportación y contenedores sueltos.',
  },
  {
    code: 'TLX-BOG-FLA-021',
    originCity: 'Bogotá D.C.',
    originDept: 'Cundinamarca',
    destCity: 'Florencia',
    destDept: 'Caquetá',
    coverageType: 'Zona ZOMAC',
    baseKgReal: 2350,
    baseKgVol: 2550,
    divFactorVol: 4000,
    minFreight: 27000,
    insurancePct: 1.0,
    minInsurance: 4500,
    coldChainPct: 30.0,
    dangerousCargoSurcharge: 65000,
    estimatedHours: 72,
    notes: 'Zona ZOMAC con frecuencia de despacho 3 veces por semana.',
  },
  {
    code: 'TLX-BOG-QUI-025',
    originCity: 'Bogotá D.C.',
    originDept: 'Cundinamarca',
    destCity: 'Quibdó',
    destDept: 'Chocó',
    coverageType: 'Zona ZOMAC',
    baseKgReal: 2650,
    baseKgVol: 2850,
    divFactorVol: 4000,
    minFreight: 30000,
    insurancePct: 1.0,
    minInsurance: 5000,
    coldChainPct: 35.0,
    dangerousCargoSurcharge: 75000,
    estimatedHours: 96,
    notes: 'Zona de difícil acceso por condición de vías. Despachos programados los días martes y viernes.',
  },
]

export const MUNICIPALITIES: MunicipalityCoverage[] = [
  {
    daneCode: '11001',
    municipality: 'Bogotá D.C.',
    department: 'Cundinamarca',
    coverageType: 'Urbana Principal',
    standardHours: 24,
    sameDay: true,
    refrigerated: true,
    maxWeightKg: 2500,
    maxVolumeM3: 45.0,
    assignedHub: 'Hub Central Zona Franca Fontibón',
    dispatchFrequency: 'Continuo 24/7',
    restrictions: 'Restricción de movilidad para vehículos de carga pesada en zonas urbanas según Pico y Placa.',
  },
  {
    daneCode: '05001',
    municipality: 'Medellín',
    department: 'Antioquia',
    coverageType: 'Urbana Principal',
    standardHours: 24,
    sameDay: true,
    refrigerated: true,
    maxWeightKg: 2000,
    maxVolumeM3: 40.0,
    assignedHub: 'Hub Regional Itagüí - Antioquia',
    dispatchFrequency: 'Continuo (4 salidas diarias)',
    restrictions: 'Restricción de ingreso al centro urbano para camiones de más de 2 ejes entre 06:00 y 20:00.',
  },
  {
    daneCode: '76001',
    municipality: 'Cali',
    department: 'Valle del Cauca',
    coverageType: 'Urbana Principal',
    standardHours: 24,
    sameDay: true,
    refrigerated: true,
    maxWeightKg: 2000,
    maxVolumeM3: 40.0,
    assignedHub: 'Hub Regional Yumbo - Valle',
    dispatchFrequency: 'Continuo (4 salidas diarias)',
    restrictions: 'Control de emisión de gases estricto y pico y placa comercial.',
  },
  {
    daneCode: '08001',
    municipality: 'Barranquilla',
    department: 'Atlántico',
    coverageType: 'Urbana Principal',
    standardHours: 48,
    sameDay: true,
    refrigerated: true,
    maxWeightKg: 2000,
    maxVolumeM3: 40.0,
    assignedHub: 'Hub Caribe Barranquilla (Galapa)',
    dispatchFrequency: 'Continuo (3 salidas diarias)',
    restrictions: 'Condiciones climáticas de alta humedad; requiere almacenamiento en bodegas climatizadas.',
  },
  {
    daneCode: '13001',
    municipality: 'Cartagena',
    department: 'Bolívar',
    coverageType: 'Urbana Principal',
    standardHours: 48,
    sameDay: false,
    refrigerated: true,
    maxWeightKg: 2500,
    maxVolumeM3: 45.0,
    assignedHub: 'Sub-Hub Mamonal Cartagena',
    dispatchFrequency: 'Diaria (2 turnos)',
    restrictions: 'Restricción de paso de carga pesada por el Centro Histórico y Bocagrande.',
  },
  {
    daneCode: '68001',
    municipality: 'Bucaramanga',
    department: 'Santander',
    coverageType: 'Urbana Principal',
    standardHours: 24,
    sameDay: false,
    refrigerated: true,
    maxWeightKg: 1800,
    maxVolumeM3: 35.0,
    assignedHub: 'Hub Nororiente Girón - Santander',
    dispatchFrequency: 'Diaria (2 turnos)',
    restrictions: 'Geografía accidentada; entregas de última milla prioritarias en vans y turbos.',
  },
  {
    daneCode: '66001',
    municipality: 'Pereira',
    department: 'Risaralda',
    coverageType: 'Urbana Principal',
    standardHours: 24,
    sameDay: true,
    refrigerated: true,
    maxWeightKg: 1800,
    maxVolumeM3: 35.0,
    assignedHub: 'Hub Eje Cafetero Dosquebradas',
    dispatchFrequency: 'Diaria (3 turnos)',
    restrictions: 'Punto neurálgico de distribución interdepartamental en el Eje Cafetero.',
  },
  {
    daneCode: '76109',
    municipality: 'Buenaventura',
    department: 'Valle del Cauca',
    coverageType: 'Trayecto Especial',
    standardHours: 48,
    sameDay: false,
    refrigerated: true,
    maxWeightKg: 3000,
    maxVolumeM3: 50.0,
    assignedHub: 'Nodo Portuario Buenaventura',
    dispatchFrequency: 'Diaria (2 turnos)',
    restrictions: 'Requiere cita previa de ingreso a terminales portuarias (SPRBUN, Aguadulce, TCBUEN).',
  },
]

export const DANGEROUS_GOODS: DangerousGoodClass[] = [
  {
    classNumber: 'Clase 1',
    name: 'Explosivos',
    status: 'PROHIBIDO',
    description: 'Fuegos artificiales, municiones, detonadores, dinamita, pólvora.',
    policy: 'Prohibido en su totalidad en la red de TransLogix bajo ninguna modalidad.',
    packingAdvice: 'No admitido bajo ningún empaque.',
  },
  {
    classNumber: 'Clase 2',
    name: 'Gases Comprimidos o Licuados',
    status: 'RESTRINGIDO',
    description: 'Propano, Butano, Oxígeno, Nitrógeno líquido, Cloro.',
    policy: 'Subclase 2.1 solo en FTL blindado. Subclase 2.2 con cilindro certificado (<5 años). Subclase 2.3 con escolta.',
    packingAdvice: 'Cilindros con prueba hidrostática y caperuza de protección de válvula.',
  },
  {
    classNumber: 'Clase 3',
    name: 'Líquidos Inflamables',
    status: 'ACEPTADO',
    description: 'Gasolina, Pinturas con solvente, Alcohol industrial, Thinner, Acetona.',
    policy: 'FTL hasta 15.000 L. En paquetería LTL máximo envases de 1L con material inerte (Vermiculita). Punto de inflamación mínimo 23°C.',
    packingAdvice: 'Frascos metálicos/HDPE máx 1L + bolsa calibre 4 + caja doble pared.',
  },
  {
    classNumber: 'Clase 6',
    name: 'Sustancias Tóxicas e Infecciosas',
    status: 'RESTRINGIDO',
    description: 'Plaguicidas, Cianuro, muestras biológicas.',
    policy: 'Prohibido consolidar con alimentos o medicinas. Muestras biológicas aceptadas bajo norma IATA P650.',
    packingAdvice: 'Triple contenedor estanco (primario + secundario + rígido exterior).',
  },
  {
    classNumber: 'Clase 8',
    name: 'Sustancias Corrosivas',
    status: 'ACEPTADO',
    description: 'Ácido sulfúrico, ácido clorhídrico, soda cáustica, baterías plomo-ácido.',
    policy: 'Máximo 5L en paquetería LTL. Baterías con bornes aislados y guacal antifugas.',
    packingAdvice: 'Envase no superior a 5L, bolsa hermética calibre 4 y cartón corrugado de 7 capas.',
  },
  {
    classNumber: 'Clase 9',
    name: 'Sustancias y Objetos Varios (Baterías Litio)',
    status: 'ACEPTADO',
    description: 'Baterías de iones de litio (ONU 3480 / 3481), hielo seco.',
    policy: 'Dispositivos con batería instalada (ONU 3481) sin recargo. Baterías sueltas (ONU 3480) con terminales aislados.',
    packingAdvice: 'Protección contra cortocircuitos y etiqueta de batería de litio ONU.',
  },
]

export const PROHIBITED_ITEMS = [
  'Dinero en efectivo (monedas o billetes), títulos valores o lingotes de oro/plata.',
  'Armas de fuego, municiones, silenciadores o armas blancas de combate.',
  'Estupefacientes, drogas ilícitas o sustancias controladas sin salvoconducto.',
  'Restos humanos, cenizas de cremación o cadáveres animales.',
  'Animales vivos de cualquier especie.',
  'Joyas de alto valor o gemas preciosas sueltas no aseguradas.',
  'Explosivos, pólvora o material pirotécnico.',
  'Material radiactivo de cualquier clase.',
  'Mercancías de contrabando o sin legal importación aduanera.',
]

export const useTranslogixStore = defineStore('translogix', () => {
  const services = ref<TranslogixService[]>(TRANSLOGIX_SERVICES)
  const routes = ref<RouteTariff[]>(ROUTE_TARIFFS)
  const municipalities = ref<MunicipalityCoverage[]>(MUNICIPALITIES)
  const dangerousGoods = ref<DangerousGoodClass[]>(DANGEROUS_GOODS)
  const prohibitedItems = ref<string[]>(PROHIBITED_ITEMS)

  // Calculadora de Cotizaciones según fórmulas oficiales de la competencia
  function calculateQuote(params: {
    originCity: string
    destCity: string
    weightKg: number
    lengthCm: number
    widthCm: number
    heightCm: number
    declaredValueCop: number
    isColdChain?: boolean
    isDangerousCargo?: boolean
  }) {
    // 1. Peso volumétrico: (Alto × Ancho × Largo) / 4000
    const volWeightKg = Math.round(((params.lengthCm * params.widthCm * params.heightCm) / 4000) * 100) / 100
    // 2. Peso a facturar: Máximo(Peso Real, Peso Volumétrico)
    const billableWeightKg = Math.max(params.weightKg, volWeightKg)

    // 3. Buscar tarifa de ruta o usar promedio nacional
    const route = routes.value.find(
      (r) =>
        r.originCity.toLowerCase().includes(params.originCity.toLowerCase()) &&
        r.destCity.toLowerCase().includes(params.destCity.toLowerCase())
    )

    const basePerKg = route ? route.baseKgReal : 1600
    const minFreight = route ? route.minFreight : 19000
    const insurancePct = route ? route.insurancePct : 1.0
    const minInsurance = route ? route.minInsurance : 3500
    const coldPct = route ? route.coldChainPct : 25.0
    const dangerousSurcharge = route ? route.dangerousCargoSurcharge : 45000
    const hours = route ? route.estimatedHours : 24

    // Flete Base = Mayor entre el flete mínimo y (pesoFacturable * tarifaPorKg)
    const calculatedFreight = Math.max(minFreight, Math.round(billableWeightKg * basePerKg))

    // Sobretasa de seguro = Mayor entre (1% sobre valor declarado) y seguro mínimo
    const insurance = Math.max(minInsurance, Math.round(params.declaredValueCop * (insurancePct / 100)))

    // Recargos especiales
    let coldSurcharge = 0
    if (params.isColdChain) {
      coldSurcharge = Math.round(calculatedFreight * (coldPct / 100))
    }

    let dangerousCargo = 0
    if (params.isDangerousCargo) {
      dangerousCargo = dangerousSurcharge
    }

    const total = calculatedFreight + insurance + coldSurcharge + dangerousCargo

    return {
      routeFound: Boolean(route),
      routeCode: route?.code ?? 'TLX-NAC-ESTANDAR',
      volWeightKg,
      billableWeightKg,
      calculatedFreight,
      insurance,
      coldSurcharge,
      dangerousCargo,
      totalFreightCop: total,
      estimatedHours: hours,
      notes: route?.notes ?? 'Tarifa sujeta a verificación de empaque y báscula.',
    }
  }

  return {
    services,
    routes,
    municipalities,
    dangerousGoods,
    prohibitedItems,
    calculateQuote,
  }
})
