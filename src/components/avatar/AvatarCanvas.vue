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
let currentMouthWidthFactor = 1.0

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

      // 1. Dibujar el avatar recortado sin fondo en alta resolución (solo Remi)
      ctx.drawImage(botImg, 0, 0, imgW, imgH, 0, 0, W, H)

      // 2. Apertura dinámica de la mandíbula y redondeo labial según el visema fonético actual
      let targetDrop = 0
      let targetWidthFactor = 1.0
      if (isSpeaking) {
        const v = chatStore.currentViseme
        const syllablePulse = 0.70 + 0.30 * Math.sin(t * 30)
        if (v === 'aa') {
          targetDrop = 8.6 * syllablePulse
          targetWidthFactor = 1.05
        } else if (v === 'oh') {
          targetDrop = 7.2 * syllablePulse
          targetWidthFactor = 0.88
        } else if (v === 'ee') {
          targetDrop = 5.0 * syllablePulse
          targetWidthFactor = 1.08
        } else if (v === 'ih') {
          targetDrop = 3.8 * syllablePulse
          targetWidthFactor = 1.02
        } else if (v === 'ou') {
          targetDrop = 6.0 * syllablePulse
          targetWidthFactor = 0.85
        } else {
          // Cierre bilabial / consonántico / pausa entre palabras
          targetDrop = 0.1
          targetWidthFactor = 1.0
        }
      }

      // Suavizado inercial ágil para articulación silábica precisa
      currentJawDrop += (targetDrop - currentJawDrop) * 0.45
      currentMouthWidthFactor += (targetWidthFactor - currentMouthWidthFactor) * 0.38

      // 3. Deformación calibrada de la boca y mentón de Remi:
      // - Coordenadas exactas en W:580 / H:460 (centrado en boca x: 0.4945, ancho boca 0.025 de W)
      // - Línea de dientes superiores en 0.2270 * H y mentón en 0.270 * H
      if (currentJawDrop > 0.2) {
        const centerX = W * 0.4945
        const halfBaseW = W * 0.026 * currentMouthWidthFactor
        const leftX = Math.floor(centerX - halfBaseW)
        const rightX = Math.ceil(centerX + halfBaseW)
        const endY = H * 0.270

        for (let x = leftX; x <= rightX; x++) {
          const u = (x - leftX) / Math.max(1, rightX - leftX)
          const dx = (u - 0.5) * 2

          // Arco parabólico anatómico: 0 en comisuras, máximo en centro
          const arch = Math.pow(Math.sin(u * Math.PI), 1.5)
          const dropAtX = currentJawDrop * arch

          if (dropAtX < 0.25) continue

          const splitYAtX = H * (0.2270 - 0.0042 * (dx * dx))
          const zoneH = endY - splitYAtX

          const srcSplitY = (splitYAtX / H) * imgH
          const srcZoneH = (zoneH / H) * imgH

          // Cavidad bucal: sombra superior profunda, tono lengua cálido inferior
          const cavityGrad = ctx.createLinearGradient(
            0,
            splitYAtX - 0.2,
            0,
            splitYAtX + dropAtX + 1.2
          )
          cavityGrad.addColorStop(0, '#150305')
          cavityGrad.addColorStop(0.42, '#350d12')
          cavityGrad.addColorStop(0.85, '#681e26')
          cavityGrad.addColorStop(1, '#3b0e13')
          ctx.fillStyle = cavityGrad
          ctx.fillRect(x, splitYAtX - 0.2, 1.35, dropAtX + 1.2)

          // Dientes superiores visibles en apertura amplia
          if (dropAtX > 2.0 && Math.abs(dx) < 0.72) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
            ctx.fillRect(x, splitYAtX - 0.2, 1.35, Math.min(1.4, dropAtX * 0.22))
          }

          // Desplazar labio inferior y mentón hacia abajo en sincronía fonética
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

      <!-- Canvas 2D transparente (solo el personaje Remi sin caja ni fondo) -->
      <div class="relative z-10 w-full overflow-visible">
        <canvas
          ref="canvasRef"
          width="580"
          height="460"
          class="w-full h-auto object-contain block drop-shadow-[0_18px_28px_rgba(0,0,0,0.65)]"
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
