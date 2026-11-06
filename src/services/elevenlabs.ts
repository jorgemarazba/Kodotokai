/**
 * ElevenLabs TTS Client & Streaming Audio Queue
 *
 * Implements high-fidelity neural speech synthesis with credit-saving optimizations:
 * - Model: eleven_flash_v2_5 (50% cheaper credits, ~75ms latency)
 * - Persistent IndexedDB + RAM audio cache to eliminate repeat spending
 * - Pre-synthesis text sanitization (strips markdown, URLs, RAG citations)
 * - Sentence-level streaming buffer for real-time progressive playback
 */

const DB_NAME = 'translogix_elevenlabs_cache'
const STORE_NAME = 'audio_blobs'
const DB_VERSION = 1

export interface ElevenLabsConfig {
  apiKey: string
  voiceId: string
  modelId: string
  enableCache: boolean
}

export interface SynthesizeOptions {
  voiceId?: string
  modelId?: string
  stability?: number
  similarityBoost?: number
}

// In-memory RAM cache for instant same-session hits
const memoryCache = new Map<string, Blob>()

// Open IndexedDB connection lazily
let dbPromise: Promise<IDBDatabase> | null = null

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not available'))
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

/**
 * Generate a deterministic hash key for cache indexing.
 */
function hashKey(text: string, voiceId: string, modelId: string): string {
  const input = `${voiceId}:${modelId}:${text}`
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i)
  }
  return `tts_${(hash >>> 0).toString(16)}`
}

/**
 * Read cached audio blob from IndexedDB.
 */
async function getCachedAudio(key: string): Promise<Blob | null> {
  if (memoryCache.has(key)) {
    return memoryCache.get(key)!
  }
  try {
    const db = await getDb()
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(key)
      req.onsuccess = () => {
        const result = req.result as Blob | undefined
        if (result) {
          memoryCache.set(key, result)
          resolve(result)
        } else {
          resolve(null)
        }
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

/**
 * Save audio blob into IndexedDB and RAM cache.
 */
async function setCachedAudio(key: string, blob: Blob): Promise<void> {
  memoryCache.set(key, blob)
  try {
    const db = await getDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(blob, key)
  } catch {
    // Non-fatal: RAM cache still functions
  }
}

/**
 * Sanitize text before sending to ElevenLabs:
 * Strips markdown, emojis, URLs, and RAG brackets so credits are spent ONLY on words.
 */
export function sanitizeTextForElevenLabs(text: string): string {
  if (!text) return ''
  return text
    // Strip RAG citations like [Source: ...], [1], [doc.md]
    .replace(/\[(?:Source|Doc|Fuente|RAG|Radicado)?:?[^\]]+\]/gi, '')
    .replace(/\[\d+\]/g, '')
    // Strip URLs
    .replace(/https?:\/\/\S+/gi, '')
    // Strip markdown formatting
    .replace(/[*_#`~>|]/g, ' ')
    // Normalize bullet points to pauses
    .replace(/^\s*[-•*]\s+/gm, ', ')
    .replace(/\s*[-•*]\s+/g, ', ')
    // Expand mathematical and business symbols
    .replace(/×/g, ' por ')
    .replace(/\//g, ' dividido entre ')
    .replace(/\+/g, ' más ')
    .replace(/%/g, ' por ciento ')
    .replace(/\$/g, ' pesos ')
    .replace(/[()]/g, ', ')
    // Remove emojis and non-alphanumeric punctuation clutter
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    // Collapse multiple punctuation/spaces
    .replace(/\s{2,}/g, ' ')
    .replace(/([.,!?;])\1+/g, '$1')
    .trim()
}

/**
 * Get active configuration from environment or defaults.
 */
export function getElevenLabsConfig(): ElevenLabsConfig {
  return {
    apiKey: (import.meta.env.VITE_ELEVENLABS_API_KEY || '').trim(),
    voiceId: (import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'cjVigY5qzO86Huf0OWal').trim(),
    modelId: (import.meta.env.VITE_ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5').trim(),
    enableCache: import.meta.env.VITE_ELEVENLABS_ENABLE_CACHE !== 'false',
  }
}

export class ElevenLabsError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isQuotaExceeded = false
  ) {
    super(message)
    this.name = 'ElevenLabsError'
  }
}

/**
 * Synthesize a single sentence or text paragraph into an audio Blob.
 * Automatically checks and populates the cache.
 */
export async function synthesizeSpeech(
  text: string,
  options?: SynthesizeOptions,
  configOverride?: Partial<ElevenLabsConfig>
): Promise<Blob> {
  const config: ElevenLabsConfig = { ...getElevenLabsConfig(), ...configOverride }
  if (!config.apiKey) {
    throw new ElevenLabsError('ElevenLabs API Key is missing', 401)
  }

  const voiceId = options?.voiceId || config.voiceId
  const modelId = options?.modelId || config.modelId
  const sanitized = sanitizeTextForElevenLabs(text)

  if (!sanitized) {
    throw new ElevenLabsError('Text is empty after sanitization', 400)
  }

  const cacheKey = hashKey(sanitized, voiceId, modelId)

  // 1. Check cache to save credits
  if (config.enableCache) {
    const cached = await getCachedAudio(cacheKey)
    if (cached) {
      return cached
    }
  }

  // 2. Query ElevenLabs API with low-latency streaming optimization
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
    voiceId
  )}?optimize_streaming_latency=3`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': config.apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: sanitized,
      model_id: modelId,
      voice_settings: {
        stability: options?.stability ?? 0.5,
        similarity_boost: options?.similarityBoost ?? 0.75,
        use_speaker_boost: true,
      },
    }),
  })

  if (!response.ok) {
    let errorDetail = ''
    try {
      const errJson = (await response.json()) as { detail?: { message?: string } }
      errorDetail = errJson?.detail?.message || ''
    } catch {
      // ignore
    }

    const isQuota =
      response.status === 429 ||
      response.status === 402 ||
      errorDetail.toLowerCase().includes('quota') ||
      errorDetail.toLowerCase().includes('credits')

    throw new ElevenLabsError(
      errorDetail || `ElevenLabs synthesis failed with HTTP ${response.status}`,
      response.status,
      isQuota
    )
  }

  const blob = await response.blob()

  // 3. Persist in cache for future calls
  if (config.enableCache) {
    await setCachedAudio(cacheKey, blob)
  }

  return blob
}

/**
 * Sequential Audio Queue for streaming TTS.
 * Takes incoming tokens, buffers them into sentences, synthesizes them in background,
 * and plays them seamlessly in order while driving lip-sync callbacks.
 */
export interface StreamingQueueCallbacks {
  onSentenceStart?: (sentence: string, audio: HTMLAudioElement) => void
  onSentenceEnd?: (sentence: string) => void
  onComplete?: () => void
  onError?: (err: unknown) => void
}

interface QueuedItem {
  sentence: string
  audioPromise: Promise<Blob>
}

export class StreamingSentenceAudioQueue {
  private buffer = ''
  private queue: QueuedItem[] = []
  private isPlaying = false
  private isFlushed = false
  private isStopped = false
  private currentAudio: HTMLAudioElement | null = null
  private callbacks: StreamingQueueCallbacks
  private voiceId?: string
  private modelId?: string

  constructor(callbacks: StreamingQueueCallbacks = {}, voiceId?: string, modelId?: string) {
    this.callbacks = callbacks
    this.voiceId = voiceId
    this.modelId = modelId
  }

  /**
   * Push incoming tokens from LLM stream.
   * Splits at sentence punctuation [. ! ? \n] while protecting common abbreviations.
   */
  public pushTokens(tokenChunk: string): void {
    if (this.isStopped) return
    this.buffer += tokenChunk

    // Look for sentence terminators: (. or ? or ! or newline) followed by space or end
    const sentenceSplitRegex = /([.!?\n]+(?:\s+|$))/g
    let match: RegExpExecArray | null
    let lastIndex = 0

    while ((match = sentenceSplitRegex.exec(this.buffer)) !== null) {
      const candidate = this.buffer.slice(lastIndex, match.index + match[0].length).trim()
      lastIndex = match.index + match[0].length

      // Avoid splitting on common abbreviations: S.A.S., Dr., Art., No., kg., etc.
      if (this.isAbbreviation(candidate)) {
        continue
      }

      if (candidate.length > 0) {
        this.enqueueSentence(candidate)
      }
      this.buffer = this.buffer.slice(lastIndex)
      sentenceSplitRegex.lastIndex = 0
      lastIndex = 0
    }
  }

  /**
   * Signal that the LLM stream has finished. Enqueues any remaining text in buffer.
   */
  public flush(): void {
    if (this.isStopped || this.isFlushed) return
    this.isFlushed = true

    const remaining = this.buffer.trim()
    this.buffer = ''
    if (remaining.length > 0) {
      this.enqueueSentence(remaining)
    }

    if (!this.isPlaying && this.queue.length === 0) {
      this.callbacks.onComplete?.()
    }
  }

  /**
   * Immediately abort playback, clear queue, and release resources.
   */
  public stop(): void {
    this.isStopped = true
    this.buffer = ''
    this.queue = []
    if (this.currentAudio) {
      try {
        this.currentAudio.pause()
        this.currentAudio.currentTime = 0
      } catch {
        // ignore
      }
      this.currentAudio = null
    }
    this.isPlaying = false
  }

  private isAbbreviation(text: string): boolean {
    const lower = text.toLowerCase()
    return (
      lower.endsWith('s.a.s.') ||
      lower.endsWith('s.a.') ||
      lower.endsWith('dr.') ||
      lower.endsWith('sr.') ||
      lower.endsWith('no.') ||
      lower.endsWith('art.') ||
      lower.endsWith('kg.') ||
      lower.endsWith('ej.') ||
      lower.endsWith('etc.')
    )
  }

  private enqueueSentence(sentence: string): void {
    const clean = sanitizeTextForElevenLabs(sentence)
    if (!clean || clean.length < 2) return

    // Pre-fetch audio immediately in parallel
    const audioPromise = synthesizeSpeech(clean, {
      voiceId: this.voiceId,
      modelId: this.modelId,
    })

    this.queue.push({ sentence: clean, audioPromise })
    this.processQueue()
  }

  private async processQueue(): Promise<void> {
    if (this.isPlaying || this.queue.length === 0 || this.isStopped) return
    this.isPlaying = true

    const currentItem = this.queue.shift()
    if (!currentItem) {
      this.isPlaying = false
      if (this.isFlushed) {
        this.callbacks.onComplete?.()
      }
      return
    }

    try {
      const blob = await currentItem.audioPromise
      if (this.isStopped) return

      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      this.currentAudio = audio

      await new Promise<void>((resolve) => {
        audio.onplay = () => {
          this.callbacks.onSentenceStart?.(currentItem.sentence, audio)
        }
        audio.onended = () => {
          URL.revokeObjectURL(url)
          this.callbacks.onSentenceEnd?.(currentItem.sentence)
          resolve()
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          this.callbacks.onSentenceEnd?.(currentItem.sentence)
          resolve()
        }

        audio.play().catch((err) => {
          URL.revokeObjectURL(url)
          this.callbacks.onError?.(err)
          resolve()
        })
      })
    } catch (err) {
      if (!this.isStopped) {
        this.callbacks.onError?.(err)
      }
    } finally {
      this.currentAudio = null
      this.isPlaying = false
      if (!this.isStopped) {
        if (this.queue.length > 0) {
          this.processQueue()
        } else if (this.isFlushed) {
          this.callbacks.onComplete?.()
        }
      }
    }
  }
}
