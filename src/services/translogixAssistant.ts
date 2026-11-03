export interface AssistantResponse {
  content: string
  emotion: 'neutral' | 'happy' | 'empatia' | 'serio'
  sources?: Array<{
    lawName: string
    articleNumber: string
    excerpt: string
  }>
}

export function generateTranslogixResponse(userQuery: string): AssistantResponse {
  const q = userQuery.toLowerCase().trim()

  // 1. Saludos y estado de ánimo
  if (
    q.includes('hola') ||
    q.includes('como estas') ||
    q.includes('cómo estás') ||
    q.includes('buenos dias') ||
    q.includes('buenos días') ||
    q.includes('buenas tardes') ||
    q.includes('buenas noches') ||
    q.includes('saludos') ||
    q.includes('que tal') ||
    q.includes('qué tal')
  ) {
    return {
      content:
        '¡Hola! Estoy muy bien y listo para ayudarte. Soy Remi, tu asesor logístico en TransLogix Colombia. Te puedo orientar en cotizaciones de fletes, tiempos de entrega en nuestras 25 rutas nacionales, transporte con cadena de frío (-20°C a 8°C), paquetería express y manejo de mercancías peligrosas. ¿Qué requerimiento de transporte tienes hoy?',
      emotion: 'happy',
      sources: [
        {
          lawName: 'TransLogix Colombia',
          articleNumber: 'Atención al Cliente & Logística',
          excerpt: 'Líder en soluciones de transporte masivo, última milla y almacenamiento WMS.',
        },
      ],
    }
  }

  // 2. Cotización y Fletes
  if (
    q.includes('cotiz') ||
    q.includes('flete') ||
    q.includes('cuanto cuesta') ||
    q.includes('cuánto cuesta') ||
    q.includes('precio') ||
    q.includes('tarifa') ||
    q.includes('valor') ||
    q.includes('costo')
  ) {
    return {
      content:
        'Para calcular tu flete en TransLogix Colombia aplicamos la fórmula oficial de cubicaje: Peso Volumétrico (kg) = (Largo × Ancho × Alto en cm) / 4.000. El flete se liquida sobre el mayor entre el peso real y el volumétrico. Al flete base se le suma el seguro de transporte (1% sobre valor declarado, mínimo $2.500 - $3.500 COP) y recargos especiales si aplica (Cadena de Frío +25% o Mercancías Peligrosas). Puedes ingresar a nuestra sección "Servicios & Transporte" para usar el Cotizador Oficial interactivo.',
      emotion: 'empatia',
      sources: [
        {
          lawName: 'Matriz Tarifaria TransLogix',
          articleNumber: 'Resolución Mintransporte & Factor 4000',
          excerpt: 'Peso Facturable = Max(Peso Real, (L×A×A)/4000). Seguro contractual 1%.',
        },
      ],
    }
  }

  // 3. Cadena de Frío
  if (
    q.includes('frio') ||
    q.includes('frío') ||
    q.includes('refriger') ||
    q.includes('congel') ||
    q.includes('temperatura') ||
    q.includes('vacuna') ||
    q.includes('medicamento') ||
    q.includes('perecedero')
  ) {
    return {
      content:
        'Nuestro servicio de Cadena de Frío Certificada opera en rango de -20°C a 8°C para productos farmacéuticos, biológicos y alimentos perecederos. Contamos con 50 furgones térmicos dotados con equipos Thermo King y Carrier, termógrafos telemáticos con lectura satelital cada 60 segundos y certificación BPT del Invima. El servicio tiene una sobretasa del 25% sobre el flete base para garantizar el control térmico ininterrumpido.',
      emotion: 'serio',
      sources: [
        {
          lawName: 'Invima & Mintransporte',
          articleNumber: 'Resolución 3793 de 2012 · BPT',
          excerpt: 'Transporte de biológicos y perecederos con monitoreo telemático continuo.',
        },
      ],
    }
  }

  // 4. Mercancías Peligrosas y Prohibidas
  if (
    q.includes('peligros') ||
    q.includes('quimic') ||
    q.includes('químic') ||
    q.includes('bateria') ||
    q.includes('batería') ||
    q.includes('litio') ||
    q.includes('inflamable') ||
    q.includes('onu') ||
    q.includes('prohibid')
  ) {
    return {
      content:
        'En TransLogix transportamos mercancías peligrosas clasificadas según el Libro Naranja de la ONU y la NTC 1692. Aceptamos bajo protocolo especial: Gases (Clase 2), Líquidos inflamables (Clase 3), Sólidos inflamables (Clase 4), Comburentes (Clase 5), Sustancias tóxicas (Clase 6), Corrosivos (Clase 8) y Misceláneos como baterías de litio (Clase 9). Se requiere Ficha de Datos de Seguridad (FDS/MSDS de 16 secciones) y embalaje homologado. Recuerda que están terminantemente prohibidos Explosivos (Clase 1) y Materiales Radiactivos (Clase 7).',
      emotion: 'serio',
      sources: [
        {
          lawName: 'Decreto 1079 de 2015',
          articleNumber: 'NTC 1692 / UN Orange Book',
          excerpt: 'Transporte terrestre de mercancías peligrosas y rotulado obligatorio.',
        },
      ],
    }
  }

  // 5. Cobertura, Rutas y Tiempos (SLA)
  if (
    q.includes('cobertura') ||
    q.includes('ruta') ||
    q.includes('tiempo') ||
    q.includes('hora') ||
    q.includes('same day') ||
    q.includes('entrega') ||
    q.includes('municipio') ||
    q.includes('ciudad')
  ) {
    return {
      content:
        'TransLogix Colombia cuenta con cobertura directa en 32 municipios estratégicos y conexión nacional a más de 650 destinos. Tiempos de entrega habituales: Rutas troncales principales (Bogotá - Medellín, Bogotá - Cali, Medellín - Bucaramanga) en 24 horas; Corredor Caribe (Barranquilla, Cartagena, Santa Marta) en 48 horas; y servicio Same Day (entrega en el mismo día) para envíos urbanos despachados antes de las 09:00 AM en Bogotá, Medellín y Cali.',
      emotion: 'empatia',
      sources: [
        {
          lawName: 'Directorio de Cobertura TLX',
          articleNumber: 'SLA Nacional 2026',
          excerpt: '32 Hubs certificados con frecuencias diarias y rastreo satelital 24/7.',
        },
      ],
    }
  }

  // 6. Servicios Generales / Portafolio
  if (
    q.includes('servicio') ||
    q.includes('portafolio') ||
    q.includes('ofrec') ||
    q.includes('empresa') ||
    q.includes('translogix') ||
    q.includes('hacen')
  ) {
    return {
      content:
        'TransLogix Colombia ofrece 5 líneas maestras de logística y transporte: 1) Carga Masiva y Semimasiva (FTL/LTL) hasta 35 toneladas por tractocamión; 2) Paquetería Empresarial y Última Milla con entregas Same Day; 3) Cadena de Frío Certificada (-20°C a 8°C); 4) Almacenamiento, WMS y Fulfillment e-Commerce en Zona Franca Fontibón; y 5) Logística Inversa y Devoluciones con inspección de calidad.',
      emotion: 'happy',
      sources: [
        {
          lawName: 'Portafolio Corporativo',
          articleNumber: 'TransLogix Colombia S.A.S.',
          excerpt: 'Flota propia de más de 480 vehículos dotados de telemetría y seguridad activa.',
        },
      ],
    }
  }

  // 7. Quién eres / Identidad
  if (q.includes('quien eres') || q.includes('quién eres') || q.includes('tu nombre')) {
    return {
      content:
        'Soy Remi, el asesor inteligente de logística y transporte de TransLogix Colombia. Mi función es facilitarte la cotización de envíos, consultar requisitos de embalaje, verificar tiempos de tránsito e informarte sobre nuestras soluciones de cadena de frío y transporte masivo.',
      emotion: 'happy',
      sources: [
        {
          lawName: 'TransLogix Colombia',
          articleNumber: 'Asistente Remi',
          excerpt: 'Asesoría logística en tiempo real con lip-sync interactivo.',
        },
      ],
    }
  }

  // 8. Respuesta General Contextual
  return {
    content:
      `Con gusto te oriento sobre "${userQuery}". En TransLogix Colombia brindamos transporte de carga masiva FTL/LTL, paquetería exprés, cadena de frío con control térmico (-20°C a 8°C) y gestión de almacenamiento WMS. Si deseas cotizar un envío, puedes indicarme la ciudad de origen, destino, peso y dimensiones, o consultar la pestaña "Servicios & Transporte" en la barra lateral.`,
    emotion: 'empatia',
    sources: [
      {
        lawName: 'TransLogix Colombia S.A.S.',
        articleNumber: 'Guía de Transporte Terrestre',
        excerpt: 'Red vial nacional, trazabilidad GPS y cumplimiento normativo Mintransporte.',
      },
    ],
  }
}
