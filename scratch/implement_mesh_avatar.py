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

  const W = 440
  const H = 520

  // 1. Escena 2D continua con WebGL
  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 100)
  camera.position.z = 10

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(W, H)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  // 2. Cargar la imagen original 100% completa de Remi-915
  const textureLoader = new THREE.TextureLoader()
  textureLoader.load('/avatar/bot.png', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter

    // Malla continua de 48 x 56 cuadrículas (sin ningún corte ni separación de capas)
    const cols = 48
    const rows = 56
    geometry = new THREE.PlaneGeometry(W, H, cols, rows)
    origPositions = new Float32Array(geometry.attributes.position!.array)

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    })

    mesh = new THREE.Mesh(geometry, material)
    scene!.add(mesh)
  })

  const startTime = performance.now()

  // 3. Cinemática continua por pesos elásticos (Bone Skinning sobre imagen original)
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
    let breathY = Math.sin(t * 2.1) * 2.2
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

          // Ambos brazos se mueven en el saludo
          rArmAngle = (-0.14 * lift + wave * lift) * easeOut
          lArmAngle = (0.10 * lift - wave * 0.5 * lift) * easeOut
          headTilt = -0.018 * lift * easeOut + Math.sin(t * 3.5) * 0.008
          breathY += Math.sin(gestureElapsed * 4.5) * 1.8 * lift * easeOut
          talkBobY = Math.sin(t * 9.0) * 1.2
        } else {
          rArmAngle = Math.sin(t * 3.6) * 0.045 + Math.sin(t * 7.2) * 0.015
          lArmAngle = Math.sin(t * 3.0 + 1.2) * 0.035
          headTilt = Math.sin(t * 3.8) * 0.012
          talkBobY = Math.sin(t * 9.5) * 1.4
          bodySwayX = Math.sin(t * 3.2) * 1.8
        }
      } else if (gesture === 'denying') {
        // Negación de cabeza "no" y encogimiento de hombros
        headTilt = Math.sin(t * 5.2) * 0.032
        bodySwayX = Math.sin(t * 5.2) * 2.8
        lArmAngle = -0.04 + Math.sin(t * 2.5) * 0.015
        rArmAngle = 0.045 + Math.sin(t * 2.5) * 0.015
        breathY -= 1.8 * Math.abs(Math.sin(t * 2.5))
        talkBobY = Math.sin(t * 8.5) * 1.0
      } else if (gesture === 'affirming') {
        // Asentimiento con la cabeza "sí" y ademán seguro
        talkBobY = Math.sin(t * 7.5) * 2.6
        headTilt = Math.sin(t * 2.5) * 0.008
        rArmAngle = -0.035 + Math.sin(t * 4.5) * 0.03
        lArmAngle = Math.sin(t * 2.5) * 0.02
        bodySwayX = Math.sin(t * 2.0) * 1.2
      } else {
        // Gesticulación explicativa dinámica de ambos brazos
        talkBobY = Math.sin(t * 9.5) * 1.4
        bodySwayX = Math.sin(t * 3.2) * 1.8
        headTilt = Math.sin(t * 3.8) * 0.012
        rArmAngle = Math.sin(t * 3.6) * 0.045 + Math.sin(t * 7.2) * 0.015
        lArmAngle = Math.sin(t * 3.0 + 1.2) * 0.035
      }

      // Modulación de visemas en la boca
      const v = chatStore.currentViseme
      const osc = 0.72 + 0.28 * Math.sin(t * 28)
      if (v === 'aa') targetJawDrop = 7.5 * osc
      else if (v === 'oh') targetJawDrop = 6.2 * osc
      else if (v === 'ee') targetJawDrop = 4.4 * osc
      else if (v === 'ih') targetJawDrop = 3.5 * osc
      else if (v === 'ou') targetJawDrop = 5.2 * osc
      else targetJawDrop = 0.8
    } else if (isListening) {
      headTilt = -0.012
      bodySwayX = Math.sin(t * 1.2) * 0.8
      targetJawDrop = 0
    } else if (isThinking) {
      headTilt = 0.016
      breathY = Math.sin(t * 3.0) * 1.6
      bodySwayX = Math.sin(t * 2.0) * 0.9
      targetJawDrop = 0
    } else {
      // Reposo natural
      headTilt = Math.sin(t * 1.1) * 0.003
      bodySwayX = Math.sin(t * 1.3) * 0.5
      targetJawDrop = 0
    }

    currentJawDrop += (targetDrop - currentJawDrop) * 0.35

    // Pivotes de articulación anatómica en coordenadas del canvas (origen en el centro 0,0)
    const sLx = -147
    const sLy = -1
    const sRx = 128
    const sRy = -1

    const cosHead = Math.cos(headTilt)
    const sinHead = Math.sin(headTilt)

    // Deformación continua elástica vértice por vértice (CERO cortes posibles)
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      const ox = origPositions[idx]!
      const oy = origPositions[idx + 1]!

      let x = ox
      let y = oy

      // A) BRAZO IZQUIERDO: Rotación fluida con peso gradual que llega a 0 en el torso
      if (ox < -70 && oy < 80) {
        // Peso elástico: 0 en el torso (ox = -70), 1 en el extremo exterior (ox <= -155)
        const weightL = smoothstep(-70, -165, ox) * smoothstep(80, -20, oy)
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

      // B) BRAZO DERECHO CON RELOJ: Rotación fluida con peso gradual que llega a 0 en la cadera
      // El reloj y la muñeca se mantienen elásticamente continuos con el torso sin ningún corte
      if (ox > 70 && oy < 80) {
        const weightR = smoothstep(70, 165, ox) * smoothstep(80, -20, oy)
        if (weightR > 0.001) {
          const angle = rArmAngle * weightR
          const ca = Math.cos(angle)
          const sa = Math.sin(angle)
          const dx = ox - sRx
          const dy = oy - sRy
          x = sRx + dx * ca - dy * sa
          y = sLy + dx * sa + dy * ca
        }
      }

      // C) LIP-SYNC CURVO: Deformación suave de los vértices de la boca y mentón
      if (currentJawDrop > 0.2 && ox > -35 && ox < 20 && oy > 45 && oy < 105) {
        const u = (ox + 35) / 55
        const arch = Math.pow(Math.sin(u * Math.PI), 1.8)
        const vWeight = smoothstep(105, 75, oy)
        y -= currentJawDrop * arch * vWeight * 0.95
      }

      // D) CINEMÁTICA CORPORAL GLOBAL (Cabeza, torso, respiración y balanceo)
      // Rotación e inclinación de cabeza
      const rx = x * cosHead - y * sinHead
      const ry = x * sinHead + y * cosHead

      // Traslación global
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

      <!-- Canvas 2D WebGL con malla elástica continua sobre bot.png (sin cortes ni capas separadas) -->
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

print('ELASTIC_SKIN_MESH_AVATAR_CREATED_SUCCESS')
