import os

VUE_PATH = os.path.abspath('src/components/avatar/AvatarCanvas.vue')

code = """<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

let animId = 0
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let mesh: THREE.Mesh | null = null
let geometry: THREE.PlaneGeometry | null = null
let origPositions: Float32Array | null = null

let targetJawDrop = 0
let currentJawDrop = 0

// Función de suavizado Hermite (C1 continua, derivada cero en extremos)
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const canvasW = 440
  const canvasH = 560

  // 1. Escena y cámara ortográfica con encuadre completo (sin cortes)
  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(
    -canvasW / 2,
    canvasW / 2,
    canvasH / 2,
    -canvasH / 2,
    0.1,
    100
  )
  camera.position.z = 10

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(canvasW, canvasH)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  // 2. Cargar la imagen original 100% íntegra (752x896)
  const textureLoader = new THREE.TextureLoader()
  textureLoader.load('/avatar/bot.png', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter

    // Dimensiones proporcionales con margen para ver la figura completa
    const planeH = 490
    const planeW = planeH * (752 / 896) // 411.25

    const cols = 48
    const rows = 56
    geometry = new THREE.PlaneGeometry(planeW, planeH, cols, rows)
    origPositions = new Float32Array(geometry.attributes.position!.array)

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    })

    mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = -10 // Espacio generoso para la cabeza en la parte superior
    scene!.add(mesh)
  })

  const startTime = performance.now()

  // 3. Cinemática continua por pesos elásticos (sin cortes en ningún brazo)
  const render = (now: number) => {
    animId = requestAnimationFrame(render)
    const t = (now - startTime) / 1000

    if (!scene || !camera || !renderer || !mesh || !geometry || !origPositions) {
      return
    }

    const pos = geometry.attributes.position!
    const arr = pos.array as Float32Array
    const count = pos.count

    const isSpeaking = chatStore.avatarState === 'speaking'
    const isListening = chatStore.avatarState === 'listening'
    const isThinking = chatStore.avatarState === 'thinking'
    const gesture = chatStore.avatarGesture

    const gestureElapsed =
      chatStore.gestureStartedAt > 0
        ? Math.max(0, (now - chatStore.gestureStartedAt) / 1000)
        : 0

    // Respiración y balanceo corporal
    let breathY = Math.sin(t * 2.1) * 2.0
    let talkBobY = 0
    let bodySwayX = 0
    let headTilt = 0
    let lArmAngle = 0
    let rArmAngle = 0

    if (isSpeaking) {
      if (gesture === 'greeting') {
        // Saludo cordial con movimiento de ambos brazos y cabeza
        if (gestureElapsed < 3.2) {
          const lift = Math.min(1, gestureElapsed * 3.5)
          const easeOut =
            gestureElapsed > 2.4
              ? Math.max(0, 1 - (gestureElapsed - 2.4) / 0.8)
              : 1
          const wave = Math.sin(gestureElapsed * 10.0) * 0.08

          rArmAngle = (-0.14 * lift + wave * lift) * easeOut
          lArmAngle = (0.10 * lift - wave * 0.5 * lift) * easeOut
          headTilt = -0.016 * lift * easeOut + Math.sin(t * 3.5) * 0.007
          breathY += Math.sin(gestureElapsed * 4.5) * 1.6 * lift * easeOut
          talkBobY = Math.sin(t * 9.0) * 1.2
        } else {
          rArmAngle = Math.sin(t * 3.6) * 0.04 + Math.sin(t * 7.2) * 0.012
          lArmAngle = Math.sin(t * 3.0 + 1.2) * 0.03
          headTilt = Math.sin(t * 3.8) * 0.01
          talkBobY = Math.sin(t * 9.5) * 1.4
          bodySwayX = Math.sin(t * 3.2) * 1.6
        }
      } else if (gesture === 'denying') {
        // Negación de cabeza "no" y encogimiento de hombros
        headTilt = Math.sin(t * 5.2) * 0.028
        bodySwayX = Math.sin(t * 5.2) * 2.5
        lArmAngle = -0.035 + Math.sin(t * 2.5) * 0.012
        rArmAngle = 0.04 + Math.sin(t * 2.5) * 0.012
        breathY -= 1.6 * Math.abs(Math.sin(t * 2.5))
        talkBobY = Math.sin(t * 8.5) * 1.0
      } else if (gesture === 'affirming') {
        // Asentimiento con la cabeza "sí"
        talkBobY = Math.sin(t * 7.5) * 2.4
        headTilt = Math.sin(t * 2.5) * 0.007
        rArmAngle = -0.03 + Math.sin(t * 4.5) * 0.025
        lArmAngle = Math.sin(t * 2.5) * 0.018
        bodySwayX = Math.sin(t * 2.0) * 1.0
      } else {
        // Gesticulación explicativa de ambos brazos
        talkBobY = Math.sin(t * 9.5) * 1.4
        bodySwayX = Math.sin(t * 3.2) * 1.6
        headTilt = Math.sin(t * 3.8) * 0.01
        rArmAngle = Math.sin(t * 3.6) * 0.04 + Math.sin(t * 7.2) * 0.012
        lArmAngle = Math.sin(t * 3.0 + 1.2) * 0.03
      }

      // Visemas en la boca
      const v = chatStore.currentViseme
      const osc = 0.72 + 0.28 * Math.sin(t * 28)
      if (v === 'aa') targetJawDrop = 7.0 * osc
      else if (v === 'oh') targetJawDrop = 5.8 * osc
      else if (v === 'ee') targetJawDrop = 4.2 * osc
      else if (v === 'ih') targetJawDrop = 3.3 * osc
      else if (v === 'ou') targetJawDrop = 4.8 * osc
      else targetJawDrop = 0.8
    } else if (isListening) {
      headTilt = -0.012
      bodySwayX = Math.sin(t * 1.2) * 0.7
      targetJawDrop = 0
    } else if (isThinking) {
      headTilt = 0.015
      breathY = Math.sin(t * 3.0) * 1.5
      bodySwayX = Math.sin(t * 2.0) * 0.8
      targetJawDrop = 0
    } else {
      // Reposo natural
      headTilt = Math.sin(t * 1.1) * 0.003
      bodySwayX = Math.sin(t * 1.3) * 0.4
      targetJawDrop = 0
    }

    currentJawDrop += (targetJawDrop - currentJawDrop) * 0.35

    // Pivotes de hombros proporcionales a la escala del plano
    const sLx = -137.2
    const sLy = -1.1
    const sRx = 119.8
    const sRy = -1.1

    const cosHead = Math.cos(headTilt)
    const sinHead = Math.sin(headTilt)

    // Deformación continua elástica (CERO cortes posibles)
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      const ox = origPositions[idx]!
      const oy = origPositions[idx + 1]!

      let x = ox
      let y = oy

      // A) BRAZO IZQUIERDO: Rotación fluida (peso = 0 en el torso)
      if (ox < -75 && oy < 70) {
        const weightL = smoothstep(-75, -155, ox) * smoothstep(70, -30, oy)
        if (weightL > 0.001) {
          const angle = lArmAngle * weightL
          const ca = Math.cos(angle)
          const sa = Math.sin(angle)
          const dx = ox - sLx
          const dy = oy - sLy
          x = sLx + dx * ca - dy * sa
          y = sLy + dx * sa + dy * ca
        }
      }

      // B) BRAZO DERECHO CON RELOJ: Rotación fluida (peso = 0 en la cadera)
      // La muñeca y el reloj se mantienen continuos con el torso sin cortes
      if (ox > 75 && oy < 70) {
        const weightR = smoothstep(75, 155, ox) * smoothstep(70, -30, oy)
        if (weightR > 0.001) {
          const angle = rArmAngle * weightR
          const ca = Math.cos(angle)
          const sa = Math.sin(angle)
          const dx = ox - sRx
          const dy = oy - sRy
          x = sRx + dx * ca - dy * sa
          y = sRy + dx * sa + dy * ca
        }
      }

      // C) LIP-SYNC CURVO: Deformación suave de la sonrisa y mentón
      if (currentJawDrop > 0.2 && ox > -30 && ox < 12 && oy > 48 && oy < 90) {
        const u = (ox + 30) / 42
        const arch = Math.pow(Math.sin(u * Math.PI), 1.8)
        const vWeight = smoothstep(90, 62, oy)
        y -= currentJawDrop * arch * vWeight * 0.95
      }

      // D) CINEMÁTICA CORPORAL GLOBAL (Cabeza, torso, respiración y balanceo)
      const rx = x * cosHead - y * sinHead
      const ry = x * sinHead + y * cosHead

      arr[idx] = rx + bodySwayX
      arr[idx + 1] = ry + breathY + talkBobY
      arr[idx + 2] = 0
    }

    pos.needsUpdate = true
    renderer.render(scene, camera)
  }

  animId = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
  if (renderer) {
    renderer.dispose()
    renderer = null
  }
})
</script>

<template>
  <div class="relative w-full h-full flex flex-col items-center justify-center select-none py-2">
    <!-- Escenario del Personaje Completo con Encuadre Perfecto -->
    <div class="relative flex items-center justify-center w-full max-w-[340px]">
      <!-- Luz ambiental trasera dinámica -->
      <div
        class="absolute w-64 h-72 rounded-full blur-3xl transition-all duration-300 -z-0"
        :class="{
          'bg-emerald-500/35 scale-110 animate-pulse': chatStore.avatarState === 'listening',
          'bg-amber-500/30 scale-105 animate-pulse': chatStore.avatarState === 'thinking',
          'bg-blue-500/40': chatStore.avatarState === 'speaking',
          'bg-blue-600/20': chatStore.avatarState === 'idle',
        }"
      ></div>

      <!-- Canvas con la figura completa visible de cabeza a cintura con reloj -->
      <canvas
        ref="canvasRef"
        width="440"
        height="560"
        class="relative z-10 w-full h-auto object-contain drop-shadow-[0_12px_25px_rgba(37,99,235,0.35)]"
      ></canvas>

      <!-- Base holográfica inferior -->
      <div
        class="absolute -bottom-1 w-56 h-2.5 rounded-full blur-sm transition-colors duration-300 z-20"
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

print('FULL_BODY_AVATAR_UPDATED_SUCCESS')
