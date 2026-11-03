<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useChatStore } from '@/stores/chat'
import { Truck } from 'lucide-vue-next'

const chatStore = useChatStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

let animId = 0
let botImg: HTMLImageElement | null = null
const imgLoaded = ref(false)
let currentJawDrop = 0

onMounted(() => {
  const img = new Image()
  img.src = '/avatar/bot.png'
  img.onload = () => {
    botImg = img
    imgLoaded.value = true
  }

  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const startTime = performance.now()

  const render = (now: number) => {
    animId = requestAnimationFrame(render)
    const t = (now - startTime) / 1000
    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)

    if (botImg && imgLoaded.value) {
      ctx.save()

      const isSpeaking = chatStore.avatarState === 'speaking'
      const isListening = chatStore.avatarState === 'listening'

      // Movimiento natural de respiración y ligera inclinación al hablar
      const breathY = Math.sin(t * 2.0) * 1.5
      const talkBobY = isSpeaking ? Math.sin(t * 10) * 0.8 : 0
      const headTilt = isSpeaking
        ? Math.sin(t * 3.8) * 0.005
        : isListening
          ? -0.007
          : Math.sin(t * 1.2) * 0.002

      ctx.translate(W / 2, H * 0.45 + breathY + talkBobY)
      ctx.rotate(headTilt)
      ctx.translate(-W / 2, -H * 0.45)

      const imgW = botImg.naturalWidth
      const imgH = botImg.naturalHeight

      // 1. Dibujar el avatar completo en alta resolución (Remi con el camión TransLogix de fondo)
      ctx.drawImage(botImg, 0, 0, imgW, imgH, 0, 0, W, H)

      // 2. Apertura dinámica de la mandíbula según el visema actual
      let targetDrop = 0
      if (isSpeaking) {
        const v = chatStore.currentViseme
        const osc = 0.70 + 0.30 * Math.sin(t * 26)
        if (v === 'aa') targetDrop = 4.6 * osc
        else if (v === 'oh') targetDrop = 3.8 * osc
        else if (v === 'ee') targetDrop = 2.6 * osc
        else if (v === 'ih') targetDrop = 2.0 * osc
        else if (v === 'ou') targetDrop = 3.0 * osc
        else targetDrop = 0.5
      }

      // Suavizado inercial de la mandíbula
      currentJawDrop += (targetDrop - currentJawDrop) * 0.35

      // 3. Deformación realista de la sonrisa de Remi (TransLogix):
      // - Coordenadas calibradas para la boca de Remi (x: 316 a 377 en 696px -> 0.454 a 0.542 de W)
      // - Parábola que sigue el contorno curvo de los dientes superiores
      if (currentJawDrop > 0.15) {
        const leftX = Math.floor(W * 0.454)
        const rightX = Math.ceil(W * 0.542)
        const endY = H * 0.310

        for (let x = leftX; x <= rightX; x++) {
          const u = (x - leftX) / (rightX - leftX)
          const dx = (u - 0.5) * 2

          // Arco parabólico suave
          const arch = Math.pow(Math.sin(u * Math.PI), 1.8)
          const dropAtX = currentJawDrop * arch

          if (dropAtX < 0.2) continue

          const splitYAtX = H * (0.2220 - 0.0050 * (dx * dx))
          const zoneH = endY - splitYAtX

          const srcSplitY = (splitYAtX / H) * imgH
          const srcZoneH = (zoneH / H) * imgH

          // Cavidad interior de la boca con gradiente
          const cavityGrad = ctx.createLinearGradient(
            0,
            splitYAtX - 0.3,
            0,
            splitYAtX + dropAtX + 1.2
          )
          cavityGrad.addColorStop(0, '#1c080a')
          cavityGrad.addColorStop(0.55, '#3b1216')
          cavityGrad.addColorStop(1, '#571c22')
          ctx.fillStyle = cavityGrad
          ctx.fillRect(x, splitYAtX - 0.2, 1.35, dropAtX + 1.2)

          // Proyectar el labio inferior y mentón hacia abajo
          const srcX = (x / W) * imgW
          const srcColW = (1.35 / W) * imgW
          const dstY = splitYAtX + dropAtX
          const dstH = endY - dstY

          ctx.drawImage(
            botImg,
            srcX,
            srcSplitY,
            srcColW,
            srcZoneH,
            x,
            dstY,
            1.35,
            dstH
          )
        }
      }

      ctx.restore()
    }
  }

  animId = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
})
</script>

<template>
  <div class="relative w-full flex flex-col items-center justify-center select-none">
    <!-- Marco elegante del Avatar 3D de Remi -->
    <div class="relative flex flex-col items-center justify-center w-full max-w-[340px] xl:max-w-[380px]">
      <!-- Resplandor dinámico trasero según el estado -->
      <div
        class="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full blur-3xl transition-all duration-300 -z-0 top-10"
        :class="{
          'bg-emerald-500/35 scale-110 animate-pulse': chatStore.avatarState === 'listening',
          'bg-amber-500/30 scale-105 animate-pulse': chatStore.avatarState === 'thinking',
          'bg-blue-500/40': chatStore.avatarState === 'speaking',
          'bg-emerald-600/20': chatStore.avatarState === 'idle',
        }"
      ></div>

      <!-- Canvas 2D con borde suave y sombra estética -->
      <div class="relative z-10 w-full rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-950/80 shadow-2xl shadow-blue-950/40">
        <canvas
          ref="canvasRef"
          width="580"
          height="460"
          class="w-full h-auto object-cover block"
        ></canvas>

        <!-- Etiqueta Flotante Superior: TransLogix Express -->
        <div class="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-[10px] text-slate-200 font-semibold shadow-md">
          <Truck class="w-3 h-3 text-emerald-400" />
          <span>Remi · TransLogix</span>
        </div>

        <!-- Indicador de Estado en Tiempo Real -->
        <div class="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-[10px] font-medium shadow-md">
          <span
            class="w-2 h-2 rounded-full"
            :class="{
              'bg-emerald-400 animate-ping': chatStore.avatarState === 'listening',
              'bg-emerald-400': chatStore.avatarState === 'idle',
              'bg-amber-400 animate-pulse': chatStore.avatarState === 'thinking',
              'bg-blue-400 animate-pulse': chatStore.avatarState === 'speaking',
            }"
          ></span>
          <span class="text-slate-200">
            {{
              chatStore.avatarState === 'speaking'
                ? 'Hablando'
                : chatStore.avatarState === 'listening'
                ? 'Escuchando'
                : chatStore.avatarState === 'thinking'
                ? 'Cotizando'
                : 'En línea'
            }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
