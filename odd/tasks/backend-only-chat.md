# Backend-only chat mode

## Objective

Make the frontend depend on the FastAPI backend for every assistant answer. Remove the local generic-response fallback and surface backend/network errors explicitly in the chat UI.

## Problem

Today `src/stores/chat.ts` answers with `src/services/translogixAssistant.ts` whenever `VITE_ENABLE_BACKEND` is not `'true'`, the backend is unreachable, or `/api/v1/ask` fails. The Vite proxy also fakes `200` responses for `/health`, `/api`, and `/v1`. Result: backend failures are invisible and users receive generic local answers.

## Scope

- Frontend only: `src/stores/chat.ts`, `src/views/ChatView.vue`, `src/components/avatar/AvatarCanvas.vue`, `src/stores/stats.ts`, `src/views/StatsView.vue`, `vite.config.ts`, `.env.example`.
- Remove `src/services/translogixAssistant.ts` (dead local response engine).
- Documentation: rewrite `README.md`; rename `AGENT.md` to `AGENTS.md` and rewrite.
- Out of scope: implementing missing backend endpoints (`/v1/tts`, `/api/v1/transcribe`, `/api/v1/feedback`); configuring PostgreSQL/`DATABASE_URL` for the existing PQRSD endpoints; changing static lawyer data.

## Constraints

- Backend is mandatory at `http://localhost:8000`; Vite proxies `/health`, `/api`, `/v1`.
- Keep Web Speech API as the only voice fallback; it is not a chat-response fallback.
- Preserve avatar/lip-sync behavior and brand invariants.
- No new dependencies.
- Artifacts in neutral Spanish; code identifiers/comments in English.

## Implementation checklist

- [x] T1. Remove `VITE_ENABLE_BACKEND` and local response fallback; always call `POST /api/v1/ask`.
- [x] T2. Parse backend error envelopes (`detail`) and network failures into user-facing chat errors.
- [x] T3. Render error messages distinctly in `ChatView` and show real backend connectivity in the avatar status.
- [x] T4. Replace stats `local` origin with `error`; update Stats view labels.
- [x] T5. Remove Vite proxy fake `200` fallbacks; update `.env.example`.
- [x] T6. Rewrite `README.md` with current architecture, setup, env, endpoints, and gaps.
- [x] T7. Rename `AGENT.md` to `AGENTS.md` and rewrite with current rules and state.
- [x] T8. Run `npm run type-check` and `npm run build`; verify live backend integration.

## Acceptance criteria

1. With the backend stopped, sending a message shows an explicit connection error and never a generic local answer.
2. With the backend running, `/api/v1/ask` answers are rendered with RAG sources.
3. `503`, `422`, `500`, and unparseable/invalid payloads produce distinct actionable messages.
4. `/health` reports `offline` in the UI when the backend is down and `online` when reachable.
5. No reference to `VITE_ENABLE_BACKEND` or `generateTranslogixResponse` remains.
6. `npm run type-check` and `npm run build` pass.
7. README and AGENTS describe the real current state and known backend gaps.

## Route and delegation

- Route: direct inline (small, tightly coupled frontend edits; no new dependencies).
- Mapping trigger: satisfied in the analysis turn; no separate explorer required.
- Writer trigger: 5+ non-trivial files, but changes are one coherent behavior edit. Implemented inline as a single work unit to keep the error contract consistent; docs are a separate work unit.
- Verification: no test runner exists in this repo. TDD exception documented; use `vue-tsc` and `vite build`, plus live backend checks.

## Delivery

- Strategy: `ask-on-risk` (default). No PR requested; work-unit commits on `frontend` (not the default branch).
- Forecast: ~250 authored code lines + ~300 documentation lines. Above the 400-line planning heuristic for the whole feature, so the work is split into two commits: behavior, then docs.

## Progress

- [x] Behavior changes
- [x] Documentation changes
- [x] Verification

## Verification evidence

- `npm run type-check` — PASS.
- `npm run build` — PASS (`vite v8.3.5`, 1767 modules).
- `GET /health` through the Vite proxy — `200` with `{"status":"ok","model":"qwen2.5:1.5b","embedding_model":"nomic-embed-text","kb_chunks":633}`.
- `POST /api/v1/ask` through the Vite proxy — `200` in ~86 s with `answer` and `sources`.
- Offline proxy simulation (target `127.0.0.1:8999`, no listener) — `/health` and `/api/v1/ask` returned `502` with `{"detail":"Backend no disponible..."}`; no fake `200`.
- `GET /api/v1/pqrsd/PQRSD-2024-000001` against the live backend — `503` with `Relational database is not configured: set DATABASE_URL...`; documented as an environment gap.
- TDD exception: the frontend has no test runner (`package.json` has no `test` script and no Vitest dependency). Verification uses `vue-tsc`, `vite build`, and live/simulated HTTP checks.

## Independent verification

`gentle-ai-verify` reviewed `a391f82..HEAD` and returned **PASS** with four low-severity notes. Three were fixed in a follow-up work unit:

- Neutral Spanish copy: `Revisá/Verificá` replaced with `Revisa/Verifica` in `src/stores/chat.ts`.
- Stats percentages: `errorPct` now derives from `100 - backendPct`, so the pair always sums 100 %.
- PQRSD malformed `200`: the payload is validated by field type before use; invalid data now reports an invalid-expedient error while keeping `backendStatus = 'online'`.

The fourth note (`scratch/remove_frontend_responses.py` contains a historical `origin: 'local'` string) is a pre-existing, non-runtime developer script and was intentionally left untouched.

Post-fix checks: `npm run type-check` PASS, `npm run build` PASS, `git diff --check` PASS.

A second targeted verification (`68837c2..HEAD`) returned PASS and noted that PQRSD validation was presence-only. The follow-up `fix: validate PQRSD response field types` adds a type guard for every required field.

## Work-unit commits

- `12ff673` — feat: require backend for chat responses.
- `68837c2` — docs: rewrite README and AGENTS for backend-only mode.
- `366647a` — fix: harden backend error handling.
- `0d119d9` — fix: validate PQRSD response field types.
