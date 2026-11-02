<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

let animId = 0
let botImg: HTMLImageElement | null = null
const imgLoaded = ref(false)
let currentJawDrop = 0
let armAmp = 0

// Brazos del personaje (coordenadas en píxeles de /avatar/bot.png, 752x896).
// Cada polígono encierra manga + antebrazo sin tocar el chaleco; el pivote es el hombro.
type Pt = [number, number]
const SRC_W = 752
const SRC_H = 896
const LEFT_ARM = {
  pivot: [125, 470] as Pt,
  poly: [[0, 440], [112, 452], [158, 600], [162, 896], [0, 896]] as Pt[],
}
const RIGHT_ARM = {
  pivot: [585, 470] as Pt,
  poly: [[598, 445], [752, 445], [752, 896], [568, 896], [560, 760], [558, 620]] as Pt[],
}
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

    // Fondo 100% transparente (sin recuadro)
    ctx.clearRect(0, 0, W, H)

    if (botImg && imgLoaded.value) {
      ctx.save()

      const isSpeaking = chatStore.avatarState === 'speaking'
      const isListening = chatStore.avatarState === 'listening'

      // Movimiento natural de respiración y gesto al hablar
      const breathY = Math.sin(t * 2.1) * 2.2
      const talkBobY = isSpeaking ? Math.sin(t * 11) * 1.1 : 0
      const headTilt = isSpeaking
        ? Math.sin(t * 4.2) * 0.007
        : isListening
          ? -0.01
          : Math.sin(t * 1.1) * 0.003

      ctx.translate(W / 2, H * 0.55 + breathY + talkBobY)
      ctx.rotate(headTilt)
      ctx.translate(-W / 2, -H * 0.55)

      const imgW = botImg.naturalWidth
      const imgH = botImg.naturalHeight

      // 1. Dibujar el personaje original íntegro con fondo transparente
      ctx.drawImage(botImg, 0, 0, imgW, imgH, 0, 0, W, H)

      // 1b. Gestos con los brazos mientras habla (balanceo suave desde el hombro)
      armAmp += ((isSpeaking ? 1 : 0) - armAmp) * 0.08
      if (armAmp > 0.01) {
        const sx = W / SRC_W
        const sy = H / SRC_H
        const drawArm = (arm: { pivot: Pt; poly: Pt[] }, angle: number) => {
          const tracePoly = () => {
            ctx.beginPath()
            arm.poly.forEach(([x, y], i) =>
              i === 0 ? ctx.moveTo(x * sx, y * sy) : ctx.lineTo(x * sx, y * sy)
            )
            ctx.closePath()
          }
          // Borrar el brazo original y redibujarlo rotado alrededor del hombro
          ctx.save()
          ctx.globalCompositeOperation = 'destination-out'
          tracePoly()
          ctx.fill()
          ctx.restore()

          ctx.save()
          ctx.translate(arm.pivot[0] * sx, arm.pivot[1] * sy)
          ctx.rotate(angle)
          ctx.translate(-arm.pivot[0] * sx, -arm.pivot[1] * sy)
          tracePoly()
          ctx.clip()
          ctx.drawImage(botImg!, 0, 0, imgW, imgH, 0, 0, W, H)
          ctx.restore()
        }
        // Ángulo positivo = el extremo del brazo se mueve hacia la izquierda de la pantalla
        drawArm(LEFT_ARM, armAmp * (0.02 + 0.045 * Math.sin(t * 3.0)))
        drawArm(RIGHT_ARM, -armAmp * (0.02 + 0.045 * Math.sin(t * 3.0 + 1.7)))
      }
      // 2. Calcular apertura de mandíbula según el visema actual
      let targetDrop = 0
      if (isSpeaking) {
        const v = chatStore.currentViseme
        const osc = 0.72 + 0.28 * Math.sin(t * 28)
        if (v === 'aa') targetDrop = 6.8 * osc
        else if (v === 'oh') targetDrop = 5.6 * osc
        else if (v === 'ee') targetDrop = 4.0 * osc
        else if (v === 'ih') targetDrop = 3.2 * osc
        else if (v === 'ou') targetDrop = 4.6 * osc
        else targetDrop = 0.8
      }

      // Suavizado de mandíbula
      currentJawDrop += (targetDrop - currentJawDrop) * 0.35

      // 3. Deformación siguiendo la CURVA EN "U" DE LA SONRISA:
      // - En el centro (dx = 0) empieza en 0.3310*H (debajo de los dientes centrales, sin bajar blanco)
      // - Hacia los lados (dx -> ±1) sube en parábola (0.3310 - 0.0095*dx²) siguiendo los dientes sin salirse al labio
      if (currentJawDrop > 0.2) {
        const leftX = Math.floor(W * 0.430)
        const rightX = Math.ceil(W * 0.520)
        const endY = H * 0.382

        for (let x = leftX; x <= rightX; x++) {
          const u = (x - leftX) / (rightX - leftX) // 0 a 1
          const dx = (u - 0.5) * 2                 // -1 a +1

          // Curva suave que se hace 0 antes de tocar las comisuras
          const arch = Math.pow(Math.sin(u * Math.PI), 1.85)
          const dropAtX = currentJawDrop * arch

          if (dropAtX < 0.2) continue

          // Parábola que sigue el borde inferior curvo de los dientes superiores
          const splitYAtX = H * (0.3310 - 0.0095 * (dx * dx))
          const zoneH = endY - splitYAtX

          const srcSplitY = (splitYAtX / H) * imgH
          const srcZoneH = (zoneH / H) * imgH

          // A) Cavidad interior cálida siguiendo la curva de la sonrisa
          const cavityGrad = ctx.createLinearGradient(
            0,
            splitYAtX - 0.3,
            0,
            splitYAtX + dropAtX + 1.2
          )
          cavityGrad.addColorStop(0, '#2b0d10')
          cavityGrad.addColorStop(0.55, '#47171c')
          cavityGrad.addColorStop(1, '#68262c')
          ctx.fillStyle = cavityGrad
          ctx.fillRect(x, splitYAtX - 0.2, 1.35, dropAtX + 1.2)

          // B) Empujar únicamente el labio inferior + mentón desde splitYAtX hacia abajo
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
  <div class="relative w-full pt-2 pb-1 flex flex-col items-center justify-center select-none overflow-hidden">
    <!-- Escenario del Personaje 3D de Medio Cuerpo (sin recuadro) -->
    <div class="relative flex items-end justify-center w-64 h-64 sm:w-72 sm:h-72">
      <!-- Luz ambiental trasera dinámica según el estado del bot -->
      <div
        class="absolute w-52 h-52 rounded-full blur-3xl transition-all duration-300 -z-0 bottom-6"
        :class="{
          'bg-emerald-500/40 scale-110 animate-pulse': chatStore.avatarState === 'listening',
          'bg-amber-500/35 scale-105 animate-pulse': chatStore.avatarState === 'thinking',
          'bg-blue-500/50': chatStore.avatarState === 'speaking',
          'bg-blue-600/25': chatStore.avatarState === 'idle',
        }"
      ></div>

      <!-- Canvas 2D transparente con Lip-Sync curvo sobre su sonrisa -->
      <canvas
        ref="canvasRef"
        width="440"
        height="520"
        class="relative z-10 h-60 sm:h-68 w-auto object-contain drop-shadow-[0_12px_25px_rgba(37,99,235,0.35)]"
      ></canvas>

      <!-- Base holográfica inferior -->
      <div
        class="absolute bottom-0 w-48 h-2 rounded-full blur-sm transition-colors duration-300 z-20"
        :class="{
          'bg-emerald-400/80': chatStore.avatarState === 'listening',
          'bg-amber-400/80': chatStore.avatarState === 'thinking',
          'bg-blue-400': chatStore.avatarState === 'speaking',
          'bg-blue-500/40': chatStore.avatarState === 'idle',
        }"
      ></div>
    </div>

    <!-- Indicador de estado -->
    <div class="mt-1 flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs shadow">
      <span
        class="w-2 h-2 rounded-full animate-pulse"
        :class="{
          'bg-emerald-400': chatStore.avatarState === 'listening',
          'bg-amber-400': chatStore.avatarState === 'thinking',
          'bg-blue-400': chatStore.avatarState === 'speaking',
          'bg-slate-400': chatStore.avatarState === 'idle',
        }"
      ></span>
      <span class="text-slate-300 font-medium">
        {{
          chatStore.avatarState === 'listening'
            ? 'Auricular activo · Escuchando tu voz...'
            : chatStore.avatarState === 'thinking'
              ? 'Analizando legislación colombiana...'
              : chatStore.avatarState === 'speaking'
                ? 'Remi-915 hablando (Lip-Sync activo)...'
                : 'Remi-915 listo para escucharte'
        }}
      </span>
    </div>
  </div>
</template>