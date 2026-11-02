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
let camera: THREE.PerspectiveCamera | null = null

// Jerarquía de partes animables del avatar 3D
let rootGroup: THREE.Group | null = null
let torsoGroup: THREE.Group | null = null
let headGroup: THREE.Group | null = null
let eyeL: THREE.Mesh | null = null
let eyeR: THREE.Mesh | null = null
let mouthGroup: THREE.Group | null = null
let mouthInterior: THREE.Mesh | null = null
let jawGroup: THREE.Group | null = null

let leftShoulder: THREE.Group | null = null
let leftElbow: THREE.Group | null = null
let leftWrist: THREE.Group | null = null

let rightShoulder: THREE.Group | null = null
let rightElbow: THREE.Group | null = null
let rightWrist: THREE.Group | null = null
let watchScreen: THREE.Mesh | null = null

let targetJawDrop = 0
let currentJawDrop = 0
let nextBlinkTime = 2.0
let isBlinking = false

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const width = 440
  const height = 520

  // 1. Escena y Cámara 3D
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50)
  camera.position.set(0, 0.28, 3.8)
  camera.lookAt(0, 0.12, 0)

  // 2. Renderizador WebGL con transparencia 100%
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  // 3. Iluminación de estudio para personaje 3D
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.3)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8)
  keyLight.position.set(2.5, 4.0, 3.5)
  scene.add(keyLight)

  const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4)
  rimLight.position.set(-3.0, 2.5, -2.5)
  scene.add(rimLight)

  const softFill = new THREE.DirectionalLight(0x93c5fd, 0.8)
  softFill.position.set(0, -2.0, 2.0)
  scene.add(softFill)

  // 4. Materiales de alta calidad para Remi-915
  const matNavySuit = new THREE.MeshStandardMaterial({
    color: 0x16254c,
    roughness: 0.45,
    metalness: 0.12,
  })
  const matWhiteShirt = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.35,
    metalness: 0.08,
  })
  const matRobotHead = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.22,
    metalness: 0.18,
  })
  const matRedTie = new THREE.MeshStandardMaterial({
    color: 0xd91621,
    roughness: 0.32,
    metalness: 0.15,
  })
  const matDarkJoint = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.5,
  })
  const matCyanGlow = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.2,
    roughness: 0.1,
  })
  const matWatchBand = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.65,
    metalness: 0.2,
  })
  const matWatchCase = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.25,
    metalness: 0.85,
  })
  const matWatchDisplay = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 1.6,
    roughness: 0.1,
  })
  const matMouth = new THREE.MeshBasicMaterial({
    color: 0x3b1115,
  })

  // 5. Construcción anatómica 3D del personaje
  rootGroup = new THREE.Group()
  scene.add(rootGroup)

  // A) Torso y Chaleco
  torsoGroup = new THREE.Group()
  torsoGroup.position.set(0, -0.42, 0)
  rootGroup.add(torsoGroup)

  // Cuerpo principal en chaleco azul marino
  const torsoGeo = new THREE.CylinderGeometry(0.56, 0.46, 1.05, 32)
  const torsoMesh = new THREE.Mesh(torsoGeo, matNavySuit)
  torsoMesh.scale.set(1.0, 1.0, 0.72)
  torsoGroup.add(torsoMesh)

  // Pechera de camisa blanca frontal
  const shirtGeo = new THREE.BoxGeometry(0.36, 0.88, 0.08)
  const shirtMesh = new THREE.Mesh(shirtGeo, matWhiteShirt)
  shirtMesh.position.set(0, 0.08, 0.35)
  torsoGroup.add(shirtMesh)

  // Corbata roja
  const tieGeo = new THREE.BoxGeometry(0.09, 0.58, 0.04)
  const tieMesh = new THREE.Mesh(tieGeo, matRedTie)
  tieMesh.position.set(0, -0.06, 0.40)
  torsoGroup.add(tieMesh)

  // Cuello robótico articulado
  const neckGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.24, 24)
  const neckMesh = new THREE.Mesh(neckGeo, matDarkJoint)
  neckMesh.position.set(0, 0.58, 0)
  torsoGroup.add(neckMesh)

  // B) Cabeza y Expresiones
  headGroup = new THREE.Group()
  headGroup.position.set(0, 0.78, 0)
  torsoGroup.add(headGroup)

  // Cráneo suave y amigable
  const headGeo = new THREE.SphereGeometry(0.46, 32, 28)
  const headMesh = new THREE.Mesh(headGeo, matRobotHead)
  headMesh.scale.set(0.96, 1.06, 0.94)
  headGroup.add(headMesh)

  // Auriculares/comunicadores laterales
  const earGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 24)
  const earL = new THREE.Mesh(earGeo, matDarkJoint)
  earL.rotation.z = Math.PI / 2
  earL.position.set(-0.47, 0.02, 0)
  headGroup.add(earL)

  const earR = new THREE.Mesh(earGeo, matDarkJoint)
  earR.rotation.z = Math.PI / 2
  earR.position.set(0.47, 0.02, 0)
  headGroup.add(earR)

  // Luces LED cyan en auriculares
  const ledGeo = new THREE.SphereGeometry(0.04, 16, 16)
  const ledL = new THREE.Mesh(ledGeo, matCyanGlow)
  ledL.position.set(-0.51, 0.02, 0)
  headGroup.add(ledL)

  const ledR = new THREE.Mesh(ledGeo, matCyanGlow)
  ledR.position.set(0.51, 0.02, 0)
  headGroup.add(ledR)

  // Ojos robóticos brillantes
  const eyeGeo = new THREE.CapsuleGeometry(0.045, 0.07, 12, 16)
  eyeL = new THREE.Mesh(eyeGeo, matCyanGlow)
  eyeL.rotation.z = Math.PI / 2
  eyeL.position.set(-0.16, 0.07, 0.42)
  headGroup.add(eyeL)

  eyeR = new THREE.Mesh(eyeGeo, matCyanGlow)
  eyeR.rotation.z = Math.PI / 2
  eyeR.position.set(0.16, 0.07, 0.42)
  headGroup.add(eyeR)

  // Boca 3D articulada con Lip-Sync
  mouthGroup = new THREE.Group()
  mouthGroup.position.set(0, -0.16, 0.43)
  headGroup.add(mouthGroup)

  const mouthGeo = new THREE.PlaneGeometry(0.16, 0.06)
  mouthInterior = new THREE.Mesh(mouthGeo, matMouth)
  mouthGroup.add(mouthInterior)

  // C) Brazo Izquierdo (Hombro -> Codo -> Muñeca/Mano)
  leftShoulder = new THREE.Group()
  leftShoulder.position.set(-0.62, 0.40, 0)
  torsoGroup.add(leftShoulder)

  const shoulderLMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), matDarkJoint)
  leftShoulder.add(shoulderLMesh)

  const upperArmLGeo = new THREE.CylinderGeometry(0.11, 0.10, 0.44, 20)
  const upperArmLMesh = new THREE.Mesh(upperArmLGeo, matWhiteShirt)
  upperArmLMesh.position.set(0, -0.22, 0)
  leftShoulder.add(upperArmLMesh)

  leftElbow = new THREE.Group()
  leftElbow.position.set(0, -0.44, 0)
  leftShoulder.add(leftElbow)

  const elbowLMesh = new THREE.Mesh(new THREE.SphereGeometry(0.10, 16, 16), matDarkJoint)
  leftElbow.add(elbowLMesh)

  const forearmLGeo = new THREE.CylinderGeometry(0.095, 0.085, 0.40, 20)
  const forearmLMesh = new THREE.Mesh(forearmLGeo, matWhiteShirt)
  forearmLMesh.position.set(0, -0.20, 0)
  leftElbow.add(forearmLMesh)

  leftWrist = new THREE.Group()
  leftWrist.position.set(0, -0.40, 0)
  leftElbow.add(leftWrist)

  const handLMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), matRobotHead)
  handLMesh.scale.set(1.0, 1.25, 0.7)
  leftWrist.add(handLMesh)

  // D) Brazo Derecho con SMARTWATCH 3D INTEGRADO
  rightShoulder = new THREE.Group()
  rightShoulder.position.set(0.62, 0.40, 0)
  torsoGroup.add(rightShoulder)

  const shoulderRMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), matDarkJoint)
  rightShoulder.add(shoulderRMesh)

  const upperArmRGeo = new THREE.CylinderGeometry(0.11, 0.10, 0.44, 20)
  const upperArmRMesh = new THREE.Mesh(upperArmRGeo, matWhiteShirt)
  upperArmRMesh.position.set(0, -0.22, 0)
  rightShoulder.add(upperArmRMesh)

  rightElbow = new THREE.Group()
  rightElbow.position.set(0, -0.44, 0)
  rightShoulder.add(rightElbow)

  const elbowRMesh = new THREE.Mesh(new THREE.SphereGeometry(0.10, 16, 16), matDarkJoint)
  rightElbow.add(elbowRMesh)

  const forearmRGeo = new THREE.CylinderGeometry(0.095, 0.085, 0.40, 20)
  const forearmRMesh = new THREE.Mesh(forearmRGeo, matWhiteShirt)
  forearmRMesh.position.set(0, -0.20, 0)
  rightElbow.add(forearmRMesh)

  // SMARTWATCH FÍSICO 3D (Montado en el antebrazo derecho antes de la mano)
  const smartwatchGroup = new THREE.Group()
  smartwatchGroup.position.set(0, -0.32, 0.02)
  rightElbow.add(smartwatchGroup)

  // Correa del reloj alrededor de la muñeca
  const bandGeo = new THREE.CylinderGeometry(0.102, 0.102, 0.08, 24)
  const bandMesh = new THREE.Mesh(bandGeo, matWatchBand)
  smartwatchGroup.add(bandMesh)

  // Caja metálica rectangular del reloj
  const caseGeo = new THREE.BoxGeometry(0.14, 0.16, 0.07)
  const caseMesh = new THREE.Mesh(caseGeo, matWatchCase)
  caseMesh.position.set(0, 0, 0.09)
  smartwatchGroup.add(caseMesh)

  // Pantalla digital roja luminiscente (con pulsación activa)
  const screenGeo = new THREE.PlaneGeometry(0.11, 0.13)
  watchScreen = new THREE.Mesh(screenGeo, matWatchDisplay)
  watchScreen.position.set(0, 0, 0.126)
  smartwatchGroup.add(watchScreen)

  // Mano derecha
  rightWrist = new THREE.Group()
  rightWrist.position.set(0, -0.40, 0)
  rightElbow.add(rightWrist)

  const handRMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), matRobotHead)
  handRMesh.scale.set(1.0, 1.25, 0.7)
  rightWrist.add(handRMesh)

  // Postura inicial natural (manos reposadas en la cadera)
  leftShoulder.rotation.set(0.15, 0, 0.28)
  leftElbow.rotation.set(-0.65, 0, -0.35)

  rightShoulder.rotation.set(0.15, 0, -0.28)
  rightElbow.rotation.set(-0.65, 0, 0.35)

  const startTime = performance.now()

  // 6. Bucle de renderizado cinematográfico y gestual
  const render = (now: number) => {
    animId = requestAnimationFrame(render)
    const t = (now - startTime) / 1000

    if (!scene || !camera || !renderer || !torsoGroup || !headGroup || !rightShoulder || !rightElbow || !leftShoulder || !leftElbow) {
      return
    }

    const isSpeaking = chatStore.avatarState === 'speaking'
    const isListening = chatStore.avatarState === 'listening'
    const isThinking = chatStore.avatarState === 'thinking'
    const gesture = chatStore.avatarGesture

    const gestureElapsed = chatStore.gestureStartedAt > 0
      ? Math.max(0, (now - chatStore.gestureStartedAt) / 1000)
      : 0

    // Parpadeo natural de ojos cada 3-5 segundos
    if (t > nextBlinkTime) {
      isBlinking = true
      if (t > nextBlinkTime + 0.15) {
        isBlinking = false
        nextBlinkTime = t + 3.0 + Math.random() * 2.5
      }
    }
    if (eyeL && eyeR) {
      const eyeScaleY = isBlinking ? 0.08 : 1.0
      eyeL.scale.set(1.0, eyeScaleY, 1.0)
      eyeR.scale.set(1.0, eyeScaleY, 1.0)
    }

    // Pantalla del reloj pulsa suavemente
    if (watchScreen) {
      const pulse = 1.2 + 0.4 * Math.sin(t * 3.5)
      ;(watchScreen.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse
    }

    // Respiración del torso
    const breathY = Math.sin(t * 2.1) * 0.02
    torsoGroup.position.y = -0.42 + breathY

    // GESTOS TRIDIMENSIONALES SEGÚN RESPUESTA
    if (isSpeaking) {
      if (gesture === 'greeting') {
        // --- 1. SALUDO CON LA MANO LEVANTADA EN 3D ---
        // Eleva el brazo derecho en 3D, flexiona el codo y agita la mano alegremente
        if (gestureElapsed < 3.2) {
          const lift = Math.min(1, gestureElapsed * 3.2)
          const easeOut = gestureElapsed > 2.4 ? Math.max(0, 1 - (gestureElapsed - 2.4) / 0.8) : 1
          const wave = Math.sin(gestureElapsed * 11) * 0.28

          // Brazo derecho sube y se posiciona para saludar
          rightShoulder.rotation.z = THREE.MathUtils.lerp(rightShoulder.rotation.z, -0.75 * lift, 0.12)
          rightShoulder.rotation.x = THREE.MathUtils.lerp(rightShoulder.rotation.x, 0.45 * lift, 0.12)
          rightElbow.rotation.x = THREE.MathUtils.lerp(rightElbow.rotation.x, -1.25 * lift, 0.12)
          rightElbow.rotation.z = (0.2 + wave) * lift * easeOut

          if (rightWrist) {
            rightWrist.rotation.z = wave * 0.8 * lift * easeOut
          }

          // Inclinación cordial de cabeza
          headGroup.rotation.z = -0.06 * lift * easeOut
          headGroup.rotation.x = 0.04 + Math.sin(t * 4.0) * 0.025
          headGroup.rotation.y = Math.sin(t * 2.0) * 0.03

          // Brazo izquierdo en reposo sutil
          leftShoulder.rotation.set(0.15, 0, 0.28 + Math.sin(t * 2.0) * 0.02)
          leftElbow.rotation.set(-0.65, 0, -0.35)
        } else {
          // Transición a gesticulación explicativa
          rightShoulder.rotation.set(
            0.2 + Math.sin(t * 3.6) * 0.12,
            0,
            -0.35 + Math.sin(t * 2.8) * 0.08
          )
          rightElbow.rotation.set(-0.85 + Math.sin(t * 4.2) * 0.18, 0, 0.2)
          leftShoulder.rotation.set(
            0.18 + Math.sin(t * 3.0 + 1.2) * 0.08,
            0,
            0.32 + Math.sin(t * 2.5) * 0.06
          )
          leftElbow.rotation.set(-0.70 + Math.sin(t * 3.8 + 1.0) * 0.12, 0, -0.2)
          headGroup.rotation.set(Math.sin(t * 3.2) * 0.04, Math.sin(t * 2.5) * 0.05, 0)
        }
      } else if (gesture === 'denying') {
        // --- 2. NEGACIÓN CON LA CABEZA Y BRAZOS ABIERTOS ---
        // Sacude la cabeza diciendo "no"
        headGroup.rotation.y = Math.sin(t * 6.0) * 0.22
        headGroup.rotation.z = Math.sin(t * 6.0) * 0.04
        headGroup.rotation.x = 0.02

        // Brazos abiertos en ademán de disculpa
        leftShoulder.rotation.set(0.25, 0.1, 0.42)
        leftElbow.rotation.set(-0.45, 0, -0.25)

        rightShoulder.rotation.set(0.25, -0.1, -0.42)
        rightElbow.rotation.set(-0.45, 0, 0.25)
      } else if (gesture === 'affirming') {
        // --- 3. ASENTIMIENTO AFIRMATIVO "SÍ" ---
        headGroup.rotation.x = Math.sin(t * 7.5) * 0.12
        headGroup.rotation.y = Math.sin(t * 2.0) * 0.02
        headGroup.rotation.z = 0

        // Brazos confirman con gesto hacia adelante
        rightShoulder.rotation.set(0.32 + Math.sin(t * 4.5) * 0.08, 0, -0.25)
        rightElbow.rotation.set(-0.95 + Math.sin(t * 4.5) * 0.14, 0, 0.15)
        leftShoulder.rotation.set(0.20, 0, 0.28)
        leftElbow.rotation.set(-0.65, 0, -0.30)
      } else {
        // --- 4. GESTICULACIÓN EXPLICATIVA GENERAL ---
        rightShoulder.rotation.set(
          0.2 + Math.sin(t * 3.6) * 0.12,
          0,
          -0.35 + Math.sin(t * 2.8) * 0.08
        )
        rightElbow.rotation.set(-0.85 + Math.sin(t * 4.2) * 0.18, 0, 0.2)
        leftShoulder.rotation.set(
          0.18 + Math.sin(t * 3.0 + 1.2) * 0.08,
          0,
          0.32 + Math.sin(t * 2.5) * 0.06
        )
        leftElbow.rotation.set(-0.70 + Math.sin(t * 3.8 + 1.0) * 0.12, 0, -0.2)
        headGroup.rotation.set(Math.sin(t * 3.2) * 0.04, Math.sin(t * 2.5) * 0.05, 0)
      }

      // LIP-SYNC TRIDIMENSIONAL
      const v = chatStore.currentViseme
      const osc = 0.72 + 0.28 * Math.sin(t * 28)
      if (v === 'aa') targetJawDrop = 0.075 * osc
      else if (v === 'oh') targetJawDrop = 0.065 * osc
      else if (v === 'ee') targetJawDrop = 0.042 * osc
      else if (v === 'ih') targetJawDrop = 0.035 * osc
      else if (v === 'ou') targetJawDrop = 0.052 * osc
      else targetJawDrop = 0.008
    } else if (isListening) {
      headGroup.rotation.set(0.06, 0.08, -0.04)
      leftShoulder.rotation.set(0.15, 0, 0.28)
      leftElbow.rotation.set(-0.65, 0, -0.35)
      rightShoulder.rotation.set(0.15, 0, -0.28)
      rightElbow.rotation.set(-0.65, 0, 0.35)
      targetJawDrop = 0
    } else if (isThinking) {
      headGroup.rotation.set(-0.08, -0.10, 0.05)
      rightShoulder.rotation.set(0.28, 0, -0.22)
      rightElbow.rotation.set(-1.10, 0, 0.45)
      targetJawDrop = 0
    } else {
      // Reposo (idle)
      headGroup.rotation.set(Math.sin(t * 1.2) * 0.02, Math.sin(t * 1.5) * 0.02, 0)
      leftShoulder.rotation.set(0.15, 0, 0.28 + Math.sin(t * 1.5) * 0.01)
      leftElbow.rotation.set(-0.65, 0, -0.35)
      rightShoulder.rotation.set(0.15, 0, -0.28 - Math.sin(t * 1.5) * 0.01)
      rightElbow.rotation.set(-0.65, 0, 0.35)
      targetJawDrop = 0
    }

    // Suavizado del Lip-Sync
    currentJawDrop += (targetJawDrop - currentJawDrop) * 0.35
    if (mouthInterior) {
      mouthInterior.scale.set(1.0 + currentJawDrop * 5.0, 1.0 + currentJawDrop * 18.0, 1.0)
    }

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

      <!-- Canvas 3D transparente acelerado por WebGL con Three.js -->
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

print('AVATAR_3D_THREEJS_CREATED_SUCCESS')
