import os

VUE_PATH = os.path.abspath('src/components/avatar/AvatarCanvas.vue')

code = """<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

let animId = 0
let botBodyImg: HTMLImageElement | null = null
let botArmLImg: HTMLImageElement | null = null
const imgLoaded = ref(false)
let currentJawDrop = 0

onMounted(() => {
  let loadedCount = 0
  const checkLoaded = () => {
    loadedCount++
    if (loadedCount >= 2) {
      imgLoaded.value = true
    }
  }

  // Capa base: Torso, rostro y brazo derecho con el reloj 100% íntegro y continuo (cero cortes)
  const bImg = new Image()
  bImg.src = '/avatar/bot_body.png'
  bImg.onload = () => {
    botBodyImg = bImg
    checkLoaded()
  }

  // Capa brazo izquierdo: se articula libremente desde el hombro sin tocar la cadera
  const alImg = new Image()
  alImg.src = '/avatar/bot_arm_l.png'
  alImg.onload = () => {
    botArmLImg = alImg
    checkLoaded()
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

    // Fondo transparente
    ctx.clearRect(0, 0, W, H)

    if (botBodyImg && botArmLImg && imgLoaded.value) {
      ctx.save()

      const isSpeaking = chatStore.avatarState === 'speaking'
      const isListening = chatStore.avatarState === 'listening'
      const isThinking = chatStore.avatarState === 'thinking'
      const gesture = chatStore.avatarGesture

      const gestureElapsed =
        chatStore.gestureStartedAt > 0
          ? Math.max(0, (now - chatStore.gestureStartedAt) / 1000)
          : 0

      // Cinemática corporal orgánica
      let breathY = Math.sin(t * 2.1) * 2.0
      let talkBobY = 0
      let bodySwayX = 0
      let headTilt = 0
      let lArmAngle = 0

      if (isSpeaking) {
        if (gesture === 'greeting') {
          // 1. SALUDO CORDIAL ("Hola", "Bienvenido", etc.)
          if (gestureElapsed < 3.2) {
            const lift = Math.min(1, gestureElapsed * 3.5)
            const easeOut =
              gestureElapsed > 2.4
                ? Math.max(0, 1 - (gestureElapsed - 2.4) / 0.8)
                : 1
            const wave = Math.sin(gestureElapsed * 9.5) * 0.06

            // El brazo izquierdo gesticula y acompaña el saludo
            lArmAngle = (-0.12 * lift + wave * lift) * easeOut
            headTilt = -0.016 * lift * easeOut + Math.sin(t * 3.5) * 0.007
            breathY += Math.sin(gestureElapsed * 4.5) * 1.5 * lift * easeOut
            talkBobY = Math.sin(t * 9.0) * 1.2
          } else {
            lArmAngle = Math.sin(t * 3.0 + 1.2) * 0.025
            headTilt = Math.sin(t * 3.8) * 0.01
            talkBobY = Math.sin(t * 9.5) * 1.4
            bodySwayX = Math.sin(t * 3.2) * 1.6
          }
        } else if (gesture === 'denying') {
          // 2. NEGACIÓN ("No tengo esa información...", "Lo siento", "Disculpa")
          // Mueve la cabeza de lado a lado diciendo "no"
          headTilt = Math.sin(t * 5.2) * 0.028
          bodySwayX = Math.sin(t * 5.2) * 2.6
          lArmAngle = -0.035 + Math.sin(t * 2.5) * 0.012
          breathY -= 1.6 * Math.abs(Math.sin(t * 2.5))
          talkBobY = Math.sin(t * 8.5) * 1.0
        } else if (gesture === 'affirming') {
          // 3. AFIRMACIÓN ("Claro", "Por supuesto", "Exacto")
          // Asiente con la cabeza diciendo que "sí"
          talkBobY = Math.sin(t * 7.5) * 2.4
          headTilt = Math.sin(t * 2.5) * 0.007
          lArmAngle = Math.sin(t * 2.5) * 0.015
          bodySwayX = Math.sin(t * 2.0) * 1.0
        } else {
          // 4. EXPLICACIÓN GENERAL
          talkBobY = Math.sin(t * 9.5) * 1.4
          bodySwayX = Math.sin(t * 3.2) * 1.6
          headTilt = Math.sin(t * 3.8) * 0.01
          lArmAngle = Math.sin(t * 3.0 + 1.2) * 0.025
        }
      } else if (isListening) {
        headTilt = -0.012
        bodySwayX = Math.sin(t * 1.2) * 0.7
        lArmAngle = Math.sin(t * 1.5) * 0.004
      } else if (isThinking) {
        headTilt = 0.015
        breathY = Math.sin(t * 3.0) * 1.5
        bodySwayX = Math.sin(t * 2.0) * 0.8
        lArmAngle = Math.sin(t * 3.0) * 0.012
      } else {
        // En reposo (idle)
        headTilt = Math.sin(t * 1.1) * 0.003
        bodySwayX = Math.sin(t * 1.3) * 0.4
        lArmAngle = Math.sin(t * 1.5) * 0.004
      }

      ctx.translate(W / 2 + bodySwayX, H * 0.55 + breathY + talkBobY)
      ctx.rotate(headTilt)
      ctx.translate(-W / 2, -H * 0.55)

      const imgW = botBodyImg.naturalWidth
      const imgH = botBodyImg.naturalHeight

      // 1. DIBUJAR CUERPO BASE (Incluye torso, cabeza y brazo derecho con el reloj 100% ÍNTEGRO Y SIN CORTES)
      ctx.drawImage(botBodyImg, 0, 0, imgW, imgH, 0, 0, W, H)

      // 2. DIBUJAR BRAZO IZQUIERDO ARTICULADO (Pivote en hombro izquierdo libre)
      ctx.save()
      const lPivotX = (125 / imgW) * W
      const lPivotY = (450 / imgH) * H
      ctx.translate(lPivotX, lPivotY)
      ctx.rotate(lArmAngle)
      ctx.translate(-lPivotX, -lPivotY)
      ctx.drawImage(botArmLImg, 0, 0, imgW, imgH, 0, 0, W, H)
      ctx.restore()

      // 3. APERTURA DE MANDÍBULA SEGÚN VISEMA ACTUAL
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

      currentJawDrop += (targetDrop - currentJawDrop) * 0.35

      // 4. LIP-SYNC CURVO SIGUIENDO LA SONRISA
      if (currentJawDrop > 0.2) {
        const leftX = Math.floor(W * 0.430)
        const rightX = Math.ceil(W * 0.520)
        const endY = H * 0.382

        for (let x = leftX; x <= rightX; x++) {
          const u = (x - leftX) / (rightX - leftX)
          const dx = (u - 0.5) * 2

          const arch = Math.pow(Math.sin(u * Math.PI), 1.85)
          const dropAtX = currentJawDrop * arch

          if (dropAtX < 0.2) continue

          const splitYAtX = H * (0.3310 - 0.0095 * (dx * dx))
          const zoneH = endY - splitYAtX

          const srcSplitY = (splitYAtX / H) * imgH
          const srcZoneH = (zoneH / H) * imgH

          // Cavidad bucal interior
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

          // Empujar únicamente el labio inferior + mentón desde botBodyImg
          const srcX = (x / W) * imgW
          const srcColW = (1.35 / W) * imgW
          const dstY = splitYAtX + dropAtX
          const dstH = endY - dstY

          ctx.drawImage(
            botBodyImg,
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
    <!-- Escenario del Personaje de Medio Cuerpo (sin recuadro) -->
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

      <!-- Canvas 2D transparente con capas articuladas y Lip-Sync -->
      <canvas
        ref="canvasRef"
        width="440"
        height="520"
        class="relative z-10 h-64 sm:h-72 w-auto object-contain drop-shadow-[0_12px_25px_rgba(37,99,235,0.35)]"
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
  </div>
</template>
"""

with open(VUE_PATH, 'w', encoding='utf-8') as f:
    f.write(code)

print('AVATAR_ZERO_CUT_UPDATED_SUCCESS')
