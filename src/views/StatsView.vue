<script setup lang="ts">
import { computed } from 'vue'
import { BarChart3, MessageSquare, Timer, ThumbsUp, Star, Mic, Server, Phone, Trash2, Briefcase } from 'lucide-vue-next'
import { useStatsStore } from '@/stores/stats'
import { useLawyersStore } from '@/stores/lawyers'

const stats = useStatsStore()
const lawyersStore = useLawyersStore()

function barPct(count: number, max: number) {
  return max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0
}

const maxTopic = computed(() => Math.max(0, ...stats.topTopics.map((t) => t.count)))
const maxLaw = computed(() => Math.max(0, ...stats.topLaws.map((t) => t.count)))
const maxDay = computed(() => Math.max(0, ...stats.queriesLast7Days.map((d) => d.count)))
const maxContact = computed(() => Math.max(0, ...stats.contactsByChannel.map((c) => c.count)))

const lawyersBySpecialty = computed(() => {
  const map = new Map<string, number>()
  for (const l of lawyersStore.lawyers) {
    map.set(l.specialtyName, (map.get(l.specialtyName) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
})
const maxSpecialty = computed(() => Math.max(0, ...lawyersBySpecialty.value.map((s) => s.count)))

const avgPrice = computed(() => {
  const list = lawyersStore.lawyers
  if (!list.length) return null
  return {
    from: Math.round(list.reduce((s, l) => s + l.priceFrom, 0) / list.length),
    to: Math.round(list.reduce((s, l) => s + (l.priceTo ?? l.priceFrom), 0) / list.length),
  }
})

function confirmReset() {
  if (window.confirm('¿Borrar todas las estadísticas guardadas en este navegador?')) {
    stats.resetStats()
  }
}
</script>

<template>
  <div class="h-full overflow-y-auto p-3.5 sm:p-6 bg-slate-950">
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div class="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase">
            <img src="/icons/nav-estadisticas.png" alt="Estadísticas" class="w-6 h-6 object-contain inline shrink-0" />
            <span>Panel de métricas</span>
          </div>
          <h2 class="text-xl font-bold text-white mt-1">Estadísticas</h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Se guardan solo en este navegador y se acumulan entre visitas.
          </p>
        </div>
        <button
          @click="confirmReset"
          class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 transition cursor-pointer shrink-0"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Reiniciar</span>
        </button>
      </div>

      <!-- Tarjetas de totales -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div class="flex items-center gap-2 text-xs text-slate-400"><MessageSquare class="w-3.5 h-3.5 text-blue-400" />Consultas</div>
          <p class="text-2xl font-bold text-white mt-1">{{ stats.totalQueries }}</p>
        </div>
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div class="flex items-center gap-2 text-xs text-slate-400"><Timer class="w-3.5 h-3.5 text-amber-400" />Tiempo de respuesta</div>
          <p class="text-2xl font-bold text-white mt-1">
            {{ stats.avgResponseMs ? (stats.avgResponseMs / 1000).toFixed(1) + ' s' : '—' }}
          </p>
        </div>
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div class="flex items-center gap-2 text-xs text-slate-400"><Star class="w-3.5 h-3.5 text-amber-400" />Calificación estrellas</div>
          <p class="text-2xl font-bold text-white mt-1">
            {{ stats.avgRatingStars === null ? '—' : stats.avgRatingStars + ' ★' }}
          </p>
          <p class="text-[11px] text-slate-500">⭐ {{ stats.totalRatings }} valoraciones</p>
        </div>
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div class="flex items-center gap-2 text-xs text-slate-400"><ThumbsUp class="w-3.5 h-3.5 text-emerald-400" />Satisfacción</div>
          <p class="text-2xl font-bold text-white mt-1">
            {{ stats.satisfactionPct === null ? '—' : stats.satisfactionPct + '%' }}
          </p>
          <p class="text-[11px] text-slate-500">👍 {{ stats.feedbackUp }} · 👎 {{ stats.feedbackDown }}</p>
        </div>
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div class="flex items-center gap-2 text-xs text-slate-400"><Phone class="w-3.5 h-3.5 text-emerald-400" />Órdenes y cotizaciones</div>
          <p class="text-2xl font-bold text-white mt-1">{{ stats.totalContacts }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <Mic class="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <p class="text-xs text-slate-400">Consultas por voz vs. texto</p>
            <p class="text-sm text-white font-semibold">
              {{ stats.voicePct }}% voz · {{ stats.totalQueries ? 100 - stats.voicePct : 0 }}% texto
            </p>
          </div>
        </div>
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <Server class="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <p class="text-xs text-slate-400">Origen de las respuestas</p>
            <p class="text-sm text-white font-semibold">
              {{ stats.backendPct }}% backend · {{ stats.totalQueries ? 100 - stats.backendPct : 0 }}% respaldo local
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Consultas por día -->
        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 class="text-sm font-semibold text-white mb-4">Consultas · últimos 7 días</h3>
          <div class="flex items-end gap-2 h-36">
            <div v-for="d in stats.queriesLast7Days" :key="d.label" class="flex-1 flex flex-col items-center justify-end h-full">
              <span class="text-[10px] text-slate-400 mb-1">{{ d.count }}</span>
              <div
                class="w-full rounded-t bg-blue-500/80"
                :style="{ height: d.count ? barPct(d.count, maxDay) * 0.9 + '%' : '2px' }"
              ></div>
              <span class="text-[10px] text-slate-500 mt-1 truncate max-w-full">{{ d.label }}</span>
            </div>
          </div>
        </section>

        <!-- Temas consultados -->
        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 class="text-sm font-semibold text-white mb-4">Temas más consultados</h3>
          <p v-if="!stats.topTopics.length" class="text-xs text-slate-500">Aún no hay consultas registradas.</p>
          <div v-for="t in stats.topTopics" :key="t.label" class="mb-2.5">
            <div class="flex justify-between text-xs text-slate-300 mb-1"><span>{{ t.label }}</span><span>{{ t.count }}</span></div>
            <div class="h-2 rounded-full bg-slate-800"><div class="h-2 rounded-full bg-emerald-500" :style="{ width: barPct(t.count, maxTopic) + '%' }"></div></div>
          </div>
        </section>

        <!-- Leyes citadas -->
        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 class="text-sm font-semibold text-white mb-4">Normas y fuentes citadas por Remi</h3>
          <p v-if="!stats.topLaws.length" class="text-xs text-slate-500">Aún no se han citado fuentes técnicas.</p>
          <div v-for="t in stats.topLaws" :key="t.label" class="mb-2.5">
            <div class="flex justify-between text-xs text-slate-300 mb-1"><span class="truncate pr-2">{{ t.label }}</span><span>{{ t.count }}</span></div>
            <div class="h-2 rounded-full bg-slate-800"><div class="h-2 rounded-full bg-blue-500" :style="{ width: barPct(t.count, maxLaw) + '%' }"></div></div>
          </div>
        </section>

        <!-- Desglose de Calificaciones 1 a 5 Estrellas -->
        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-white flex items-center gap-2">
              <Star class="w-4 h-4 text-amber-400" />
              <span>Calificación de atención (1 a 5★)</span>
            </h3>
            <span v-if="stats.avgRatingStars !== null" class="text-xs font-bold text-amber-300">
              {{ stats.avgRatingStars }} / 5.0
            </span>
          </div>
          <p v-if="!stats.totalRatings" class="text-xs text-slate-500">Aún no hay calificaciones registradas.</p>
          <div v-else class="space-y-2">
            <div v-for="item in stats.ratingsDistribution" :key="item.star">
              <div class="flex justify-between text-xs text-slate-300 mb-1">
                <span class="flex items-center gap-1">{{ item.star }} ★</span>
                <span>{{ item.count }} ({{ stats.totalRatings ? Math.round((item.count / stats.totalRatings) * 100) : 0 }}%)</span>
              </div>
              <div class="h-2 rounded-full bg-slate-800">
                <div
                  class="h-2 rounded-full bg-amber-400"
                  :style="{ width: stats.totalRatings ? (item.count / stats.totalRatings) * 100 + '%' : '0%' }"
                ></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Contactos por canal -->
        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 class="text-sm font-semibold text-white mb-4">Órdenes y cotizaciones por canal</h3>
          <div v-for="c in stats.contactsByChannel" :key="c.label" class="mb-2.5">
            <div class="flex justify-between text-xs text-slate-300 mb-1"><span>{{ c.label }}</span><span>{{ c.count }}</span></div>
            <div class="h-2 rounded-full bg-slate-800"><div class="h-2 rounded-full bg-amber-500" :style="{ width: c.count ? barPct(c.count, maxContact) + '%' : '0%' }"></div></div>
          </div>
        </section>

        <!-- Directorio de abogados -->
        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:col-span-2">
          <h3 class="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <Briefcase class="w-4 h-4 text-blue-400" />
            Directorio de abogados · {{ lawyersStore.lawyers.length }} publicados
          </h3>
          <p v-if="avgPrice" class="text-xs text-slate-400 mb-4">
            Tarifa promedio: ${{ avgPrice.from.toLocaleString('es-CO') }} – ${{ avgPrice.to.toLocaleString('es-CO') }} COP
          </p>
          <div v-for="s in lawyersBySpecialty" :key="s.label" class="mb-2.5">
            <div class="flex justify-between text-xs text-slate-300 mb-1"><span>{{ s.label }}</span><span>{{ s.count }}</span></div>
            <div class="h-2 rounded-full bg-slate-800"><div class="h-2 rounded-full bg-purple-500" :style="{ width: barPct(s.count, maxSpecialty) + '%' }"></div></div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
