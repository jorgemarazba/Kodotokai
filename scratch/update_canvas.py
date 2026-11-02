import os

VUE_PATH = os.path.abspath('src/components/avatar/AvatarCanvas.vue')

with open(VUE_PATH, 'r', encoding='utf-8') as f:
    text = f.read()

script_start = text.find('<script')
script_end = text.find('</script>') + len('</script>')

new_script = """<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

let animId = 0
let botBodyImg: HTMLImageElement | null = null
let botArmLImg: HTMLImageElement | null = null
let botArmRImg: HTMLImageElement | null = null
const imgLoaded = ref(false)
let currentJawDrop = 0

onMounted(() => {
  let loadedCount = 0
  const checkLoaded = () => {
    loadedCount++
    if (loadedCount >= 3) {
      imgLoaded.value = true
    }
  }

  const bImg = new Image()
  bImg.src = '/avatar/bot_body.png'
  bImg.onload = () => {
    botBodyImg = bImg
    checkLoaded()
  }

  const alImg = new Image()
  alImg.src = '/avatar/bot_arm_l.png'
  alImg.onload = () => {
    botArmLImg = alImg
    checkLoaded()
  }

  const arImg = new Image()
  arImg.src = '/avatar/bot_arm_r.png'
  arImg.onload = () => {
    botArmRImg = arImg
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

    // Fondo 100% transparente (sin recuadro)
    ctx.clearRect(0, 0, W, H)

    if (botBodyImg && botArmLImg && botArmRImg && imgLoaded.value) {
      ctx.save()

      const isSpeaking = chatStore.avatarState === 'speaking'
      const isListening = chatStore.avatarState === 'listening'

      // Movimiento natural y fluido de torso, hombros y cabeza
      const breathY = Math.sin(t * 2.1) * 2.2
      const talkBobY = isSpeaking ? Math.sin(t * 9.5) * 1.4 : 0
      const bodySwayX = isSpeaking ? Math.sin(t * 3.2) * 1.8 : 0
      const headTilt = isSpeaking
        ? Math.sin(t * 3.8) * 0.012
        : isListening
          ? -0.01
          : Math.sin(t * 1.1) * 0.003

      ctx.translate(W / 2 + bodySwayX, H * 0.55 + breathY + talkBobY)
      ctx.rotate(headTilt)
      ctx.translate(-W / 2, -H * 0.55)

      const imgW = botBodyImg.naturalWidth
      const imgH = botBodyImg.naturalHeight

      // 1. Capa Torso / Cabeza / Cuello base
      ctx.drawImage(botBodyImg, 0, 0, imgW, imgH, 0, 0, W, H)

      // 2. Capa Brazo Izquierdo (pivote en hombro izquierdo)
      ctx.save()
      const lPivotX = (125 / imgW) * W
      const lPivotY = (450 / imgH) * H
      const lArmAngle = isSpeaking
        ? Math.sin(t * 3.2) * 0.02
        : Math.sin(t * 1.5) * 0.005
      ctx.translate(lPivotX, lPivotY)
      ctx.rotate(lArmAngle)
      ctx.translate(-lPivotX, -lPivotY)
      ctx.drawImage(botArmLImg, 0, 0, imgW, imgH, 0, 0, W, H)
      ctx.restore()

      // 3. Capa Brazo Derecho con Reloj integrado (pivote en hombro derecho)
      // Gesticulación natural: la manga, codo, muñeca y reloj se mueven juntos sin cortes
      ctx.save()
      const rPivotX = (595 / imgW) * W
      const rPivotY = (450 / imgH) * H
      const rArmAngle = isSpeaking
        ? Math.sin(t * 3.8) * 0.035 + Math.sin(t * 7.4) * 0.012
        : Math.sin(t * 1.5 + 0.6) * 0.005
      ctx.translate(rPivotX, rPivotY)
      ctx.rotate(rArmAngle)
      ctx.translate(-rPivotX, -rPivotY)
      ctx.drawImage(botArmRImg, 0, 0, imgW, imgH, 0, 0, W, H)
      ctx.restore()

      // 4. Calcular apertura de mandíbula según el visema actual
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

      // 5. Deformación siguiendo la CURVA EN "U" DE LA SONRISA
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

          // Cavidad interior cálida
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

          // Empujar únicamente labio inferior + mentón desde botBodyImg
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
</script>"""

updated_text = new_script + text[script_end:]
with open(VUE_PATH, 'w', encoding='utf-8') as f:
    f.write(updated_text)

print('AVATAR_CANVAS_UPDATED_SUCCESS')
