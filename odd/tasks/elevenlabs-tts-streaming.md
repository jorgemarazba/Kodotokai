# ElevenLabs TTS & Progressive Streaming

## Objective

Integrate ElevenLabs neural speech synthesis into Remi, TransLogix Colombia's assistant, with high-fidelity voice output, strict credit optimization (model selection, persistent caching, and text sanitization), and real-time sentence streaming synchronized with the backend.

## Problem

Previously, the assistant relied on browser-native Web Speech API or non-existent backend TTS (`/v1/tts`), and chat answers were consumed in a blocking manner via `/api/v1/ask` without streaming tokens. Under CPU-only local LLM execution, generating full answers can take tens of seconds, causing awkward pauses before any voice or visual response begins. Furthermore, ElevenLabs usage has a strict character quota (~9,865 credits), requiring defensive architectural measures to avoid quota exhaustion.

## Scope

- Frontend service `src/services/elevenlabs.ts` managing API communication, text sanitization, multi-tier audio caching (IndexedDB + RAM), and `StreamingSentenceAudioQueue`.
- Store `src/stores/chat.ts` integration: ElevenLabs default voice profiles, seamless fallback to Web Speech API, and token streaming via `/api/v1/ask/stream` with fallback to `/api/v1/ask`.
- Backend alignment in `../backend-translogix/api/main.py`: `X-Sources-Base64` response header on `/api/v1/ask/stream` for full RAG citation traceability.
- Environment configuration: `.env` and `.env.example` documenting `VITE_ELEVENLABS_*` variables.
- Documentation: `README.md`, `AGENTS.md`, and this task doc.

## Credit Optimization Strategy

1. **Model `eleven_flash_v2_5`**: Consumes 50% fewer credits per character than standard models while offering ~75ms ultra-low latency.
2. **Text Sanitization**: Purges markdown symbols, citations (`[1]`, `[Source: ...]`), emojis, URLs, and repeated whitespace prior to synthesis.
3. **Persistent Audio Caching**: Uses IndexedDB (`translogix_elevenlabs_cache`) indexed by `hash(voiceId:modelId:cleanedText)`. Greetings and repeated queries cost 0 credits.
4. **Resilient Fallback**: Automatically falls back to Web Speech API on 401, 429 (out of quota), or network failure.

## Implementation checklist

- [x] T1. Create `src/services/elevenlabs.ts` with API client, text sanitization, IndexedDB cache, and streaming sentence queue.
- [x] T2. Integrate ElevenLabs voice profiles in `src/stores/chat.ts` (`eleven-remi-eric`, `eleven-brian`, `eleven-adam`).
- [x] T3. Implement progressive token streaming via `/api/v1/ask/stream` and sentence-by-sentence queue playback in `chat.ts`.
- [x] T4. Expose `X-Sources-Base64` on `/api/v1/ask/stream` in `backend-translogix` for complete citation preservation.
- [x] T5. Update `.env.example` and `env.d.ts` with typed ElevenLabs environment variables.
- [x] T6. Update `AGENTS.md` and `README.md` to document the streaming architecture and TTS features.
- [x] T7. Validate TypeScript and build (`npm run type-check`, `npm run build`).
