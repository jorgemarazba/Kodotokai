/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ELEVENLABS_API_KEY?: string
  readonly VITE_ELEVENLABS_VOICE_ID?: string
  readonly VITE_ELEVENLABS_MODEL_ID?: string
  readonly VITE_ELEVENLABS_ENABLE_CACHE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
