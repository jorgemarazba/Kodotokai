import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'remi915-stats'

export type QueryOrigin = 'backend' | 'local'
export type QueryMode = 'text' | 'voice'
export type ContactChannel = 'whatsapp' | 'phone' | 'email'

export interface QueryEvent {
  id: string
  ts: number
  topic: string
  responseMs: number
  origin: QueryOrigin
  mode: QueryMode
  laws: string[]
}

export interface ContactEvent {
  ts: number
  channel: ContactChannel
  lawyerId: string
}

interface PersistedStats {
  queries: QueryEvent[]
  feedback: Record<string, 1 | -1>
  contacts: ContactEvent[]
}

const TOPIC_KEYWORDS: Array<{ topic: string; words: string[] }> = [
  { topic: 'Laboral', words: ['despid', 'liquidaci', 'trabajo', 'sueldo', 'salario', 'contrato laboral', 'prestaciones', 'cesant', 'pensi', 'incapacidad'] },
  { topic: 'Arriendo', words: ['arriend', 'inquilin', 'arrendador', 'canon', 'inmueble', 'desalojo'] },
  { topic: 'Consumidor', words: ['consumidor', 'garant', 'producto', 'compra', 'devoluci', 'sic', 'reembolso'] },
  { topic: 'Tránsito', words: ['tránsito', 'transito', 'multa', 'comparendo', 'accidente', 'licencia', 'soat', 'fotomulta'] },
  { topic: 'Familia', words: ['familia', 'divorcio', 'custodia', 'alimentos', 'herencia', 'matrimonio', 'hijo', 'sucesi'] },
  { topic: 'Convivencia', words: ['convivencia', 'vecino', 'ruido', 'inspector', 'policía', 'policia', 'cai'] },
  { topic: 'Penal', words: ['penal', 'denuncia', 'delito', 'robo', 'hurto', 'estafa', 'fiscal'] },
]

export function classifyTopic(query: string): string {
  const q = query.toLowerCase()
  for (const { topic, words } of TOPIC_KEYWORDS) {
    if (words.some((w) => q.includes(w))) return topic
  }
  return 'Otros'
}

function loadPersisted(): PersistedStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedStats>
      return {
        queries: parsed.queries ?? [],
        feedback: parsed.feedback ?? {},
        contacts: parsed.contacts ?? [],
      }
    }
  } catch {
    // datos corruptos o localStorage no disponible: empezar de cero
  }
  return { queries: [], feedback: {}, contacts: [] }
}

function countBy<T>(items: T[], keyFn: (item: T) => string[]): Array<{ label: string; count: number }> {
  const map = new Map<string, number>()
  for (const item of items) {
    for (const key of keyFn(item)) {
      map.set(key, (map.get(key) ?? 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

export const useStatsStore = defineStore('stats', () => {
  const initial = loadPersisted()
  const queries = ref<QueryEvent[]>(initial.queries)
  const feedback = ref<Record<string, 1 | -1>>(initial.feedback)
  const contacts = ref<ContactEvent[]>(initial.contacts)

  watch(
    [queries, feedback, contacts],
    () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            queries: queries.value.slice(-2000),
            feedback: feedback.value,
            contacts: contacts.value.slice(-2000),
          })
        )
      } catch {
        // ignorar si no hay almacenamiento disponible
      }
    },
    { deep: true }
  )

  function logQuery(payload: {
    question: string
    responseMs: number
    origin: QueryOrigin
    mode: QueryMode
    laws: string[]
  }) {
    queries.value.push({
      id: crypto.randomUUID(),
      ts: Date.now(),
      topic: classifyTopic(payload.question),
      responseMs: payload.responseMs,
      origin: payload.origin,
      mode: payload.mode,
      laws: payload.laws,
    })
  }

  // Pulsar de nuevo el mismo voto lo quita
  function setFeedback(messageId: string, value: 1 | -1) {
    if (feedback.value[messageId] === value) {
      const { [messageId]: _removed, ...rest } = feedback.value
      feedback.value = rest
    } else {
      feedback.value = { ...feedback.value, [messageId]: value }
    }
  }

  function logContact(channel: ContactChannel, lawyerId: string) {
    contacts.value.push({ ts: Date.now(), channel, lawyerId })
  }

  function resetStats() {
    queries.value = []
    feedback.value = {}
    contacts.value = []
  }

  const totalQueries = computed(() => queries.value.length)

  const avgResponseMs = computed(() => {
    const withTime = queries.value.filter((q) => q.responseMs > 0)
    if (!withTime.length) return 0
    return Math.round(withTime.reduce((s, q) => s + q.responseMs, 0) / withTime.length)
  })

  const backendPct = computed(() =>
    totalQueries.value
      ? Math.round((queries.value.filter((q) => q.origin === 'backend').length / totalQueries.value) * 100)
      : 0
  )

  const voicePct = computed(() =>
    totalQueries.value
      ? Math.round((queries.value.filter((q) => q.mode === 'voice').length / totalQueries.value) * 100)
      : 0
  )

  const topTopics = computed(() => countBy(queries.value, (q) => [q.topic]))
  const topLaws = computed(() => countBy(queries.value, (q) => q.laws).slice(0, 6))

  const feedbackUp = computed(() => Object.values(feedback.value).filter((v) => v === 1).length)
  const feedbackDown = computed(() => Object.values(feedback.value).filter((v) => v === -1).length)
  const satisfactionPct = computed(() => {
    const total = feedbackUp.value + feedbackDown.value
    return total ? Math.round((feedbackUp.value / total) * 100) : null
  })

  const totalContacts = computed(() => contacts.value.length)
  const contactsByChannel = computed(() => [
    { label: 'WhatsApp', count: contacts.value.filter((c) => c.channel === 'whatsapp').length },
    { label: 'Llamada', count: contacts.value.filter((c) => c.channel === 'phone').length },
    { label: 'Correo', count: contacts.value.filter((c) => c.channel === 'email').length },
  ])

  // Consultas de los últimos 7 días (incluye hoy)
  const queriesLast7Days = computed(() => {
    const days: Array<{ label: string; count: number }> = []
    for (let i = 6; i >= 0; i--) {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - i)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      days.push({
        label: start.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
        count: queries.value.filter((q) => q.ts >= start.getTime() && q.ts < end.getTime()).length,
      })
    }
    return days
  })

  return {
    queries,
    feedback,
    contacts,
    logQuery,
    setFeedback,
    logContact,
    resetStats,
    totalQueries,
    avgResponseMs,
    backendPct,
    voicePct,
    topTopics,
    topLaws,
    feedbackUp,
    feedbackDown,
    satisfactionPct,
    totalContacts,
    contactsByChannel,
    queriesLast7Days,
  }
})
