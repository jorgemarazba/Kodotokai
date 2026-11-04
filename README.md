# Kodotokai — Remi · TransLogix Colombia

Frontend del asesor logístico **Remi** para **TransLogix Colombia S.A.S.** Aplicación Vue 3 + Vite con avatar animado, entrada por voz, cotización de fletes y consulta de la base de conocimiento corporativa.

> **El backend es obligatorio.** El frontend ya no responde con un motor local de respaldo. Si FastAPI no está disponible, la interfaz muestra el error de conexión o el error HTTP devuelto por la API.

---

## 1. Arquitectura actual

```text
Navegador
  └── Vue 3 (:5173)
        └── Proxy Vite (/health, /api, /v1)
              └── FastAPI (:8000)
                    ├── ChromaDB (chroma_db/)
                    └── Ollama (:11434)
                          ├── chat: qwen2.5
                          └── embeddings: nomic-embed-text
```

El backend vive en un repositorio separado. En este entorno está en:

```text
../../backend-translogix
```

No está embebido en este repositorio. La API expone un RAG vectorial local (FastAPI + ChromaDB + Ollama) con una capa relacional opcional para PQRSD, y es la única fuente de respuestas del asistente. Ajusta la ruta según tu checkout.

### Flujo de una consulta

1. El usuario envía una pregunta desde `ChatView.vue`.
2. `src/stores/chat.ts` hace `POST /api/v1/ask` a través del proxy de Vite.
3. FastAPI recupera fragmentos de ChromaDB, genera la respuesta con Ollama y devuelve `{ answer, sources }`.
4. El frontend muestra la respuesta y sus fuentes RAG.
5. Si la API falla, se muestra un mensaje de error accionable. No hay respuesta genérica local.

---

## 2. Stack

| Capa | Tecnología |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup lang="ts">`) |
| Build | Vite 8 |
| Estilos | Tailwind CSS 4 |
| Estado | Pinia |
| Rutas | Vue Router |
| Iconos | `lucide-vue-next` |
| Avatar | Canvas 2D con lip-sync y animación procedural |
| Backend | FastAPI + ChromaDB + Ollama (repositorio externo) |

---

## 3. Requisitos

| Necesidad | Versión / condición |
|---|---|
| Node.js | `^22.18.0` o `>=24.12.0` |
| npm | Incluido con Node |
| Backend FastAPI | Corriendo en `http://localhost:8000` |
| Ollama | Corriendo en `http://localhost:11434` |
| Modelo de chat | `qwen2.5:3b-instruct-q4_K_M` (default del backend) o el definido en su `.env` |
| Modelo de embeddings | `nomic-embed-text` |
| PostgreSQL 13+ | Opcional. Solo para PQRSD; el `docker-compose.yml` del backend incluye `postgres:16-alpine`. |
| Puertos libres | `5173` (frontend), `8000` (API), `11434` (Ollama), `5432` (PostgreSQL opcional) |

---

## 4. Estructura del proyecto

```text
Kodotokai/
├── public/                         # Recursos estáticos (avatar, logos, fondos)
├── src/
│   ├── components/
│   │   ├── avatar/AvatarCanvas.vue # Avatar animado y lip-sync
│   │   ├── entry/EntryTabsModal.vue
│   │   ├── layout/AppSidebar.vue
│   │   └── pqrsd/PqrsdModal.vue
│   ├── services/
│   │   └── pqrsd.ts                # Cliente de /api/v1/pqrsd
│   ├── stores/
│   │   ├── chat.ts                 # Conversación, voz y errores de API
│   │   ├── lawyers.ts              # Datos estáticos de servicios
│   │   ├── pqrsd.ts
│   │   ├── session.ts
│   │   ├── stats.ts                # Métricas locales (backend vs errores)
│   │   └── translogix.ts           # Rutas, tarifas y catálogos
│   ├── views/
│   │   ├── ChatView.vue
│   │   ├── LawyersView.vue
│   │   └── StatsView.vue
│   ├── App.vue
│   ├── main.ts
│   └── router/index.ts
├── odd/tasks/                      # Documentación de trabajo del proyecto
├── .env.example
├── AGENTS.md
└── vite.config.ts
```

---

## 5. Variables de entorno

Archivo: `.env` en la raíz (ignorado por Git). Plantilla: `.env.example`.

```env
VITE_API_BASE_URL=/api/v1
```

| Variable | Default | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Base para `POST /feedback` en `src/stores/stats.ts`. Se recomienda mantenerla relativa para pasar por el proxy de Vite. |

Notas:

- `VITE_ENABLE_BACKEND` fue eliminada. El backend ya no es opcional.
- `VITE_DEFAULT_AVATAR_URL` y `VITE_APP_TITLE` fueron eliminadas porque el código nunca las leyó.
- Si se usa una URL absoluta en `VITE_API_BASE_URL`, el navegador deja de pasar por el proxy y aplica CORS. El backend actual no configura CORS.

Las variables del backend (`OLLAMA_*`, `RAG_*`, `CHROMA_*`, `DATABASE_URL`, `DB_*`, `API_PORT`, etc.) se documentan en `../../backend-translogix/README.md`.

---

## 6. Arranque

### 6.1 Backend (terminal 1)

```bash
cd ../../backend-translogix   # ajusta la ruta según tu checkout

# Opcional: Ollama + Open WebUI + PostgreSQL
docker compose up -d

# Una sola vez
python scripts/dev.py setup
python scripts/dev.py models
python scripts/dev.py ingest

# Opcional: habilitar PQRSD (requiere PostgreSQL)
# Agregar a .env: DATABASE_URL=postgresql+psycopg://asistencia:asistencia@localhost:5432/asistencia
python scripts/dev.py db-init --seed

# Levantar la API en API_PORT (default 8000)
python scripts/dev.py api
```

Equivalente manual:

```bash
cd ../../backend-translogix
.venv/bin/python -m uvicorn api.main:app --port 8000 --reload
```

Verificación rápida:

```bash
curl -s http://localhost:8000/health
```

La respuesta debe incluir `"status":"ok"` y `kb_chunks` mayor que cero. Si `kb_chunks` es `0`, ejecuta `python scripts/dev.py ingest`.

Sin `DATABASE_URL`, el RAG funciona igual pero `/api/v1/pqrsd` responde `503` con el detalle `Relational database is not configured...`.

### 6.2 Frontend (terminal 2)

```bash
cd Kodotokai
npm install
cp .env.example .env   # solo la primera vez
npm run dev
```

Vite abre el navegador en `http://localhost:5173`.

### 6.3 Orden recomendado

1. Ollama (`ollama serve` o `docker compose up -d`).
2. PostgreSQL opcional (`docker compose up -d postgres` + `DATABASE_URL`) si se usará PQRSD.
3. Índice vectorial (`python scripts/dev.py ingest`).
4. API FastAPI en `:8000`.
5. Frontend Vite en `:5173`.

---

## 7. Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR en `:5173`. |
| `npm run build` | Type-check (`vue-tsc`) + build de producción. |
| `npm run build-only` | Build de producción sin type-check. |
| `npm run type-check` | Verificación de tipos con `vue-tsc`. |
| `npm run preview` | Sirve el build de producción. |

No hay suite de tests automatizados en el frontend. La verificación funcional se hace con `type-check`, build y pruebas manuales contra la API.

---

## 8. Manejo de errores de la API

El frontend ya no oculta fallos. Cada error se muestra en el chat con estilo diferenciado y se registra en estadísticas con origen `error`.

| Situación | Mensaje mostrado |
|---|---|
| Backend caído / proxy sin conexión | `No se pudo conectar con el backend. Verifica que FastAPI esté corriendo en http://localhost:8000...` |
| `502` / `504` del proxy | `El backend no respondió (502/504). Verifica que FastAPI esté corriendo...` |
| `503` de FastAPI | `El backend no pudo completar la solicitud (503)...` con el `detail` que identifica el servicio faltante (Ollama o `DATABASE_URL`). |
| `422` | `El backend rechazó la consulta (422)...` con el `detail` devuelto, incluidas categorías disponibles. |
| `500` | `El backend falló al procesar la consulta (500). Revisa los logs del servidor...` |
| `200` sin `answer` | `El backend respondió sin una respuesta válida...` |
| Radicado PQRSD `404` | `No se encontró el radicado PQRSD-... en el backend...` |

El indicador del panel derecho muestra el estado real de la API: **Backend en línea**, **Backend sin conexión** o **Verificando backend**.

El proxy de Vite dejó de devolver `200` falsos. Si el backend no está disponible, Vite responde `502` con `{ "detail": "Backend no disponible..." }`.

---

## 9. Contrato de API

### Endpoints consumidos por el frontend

| Método | Ruta | Estado en el backend |
|---|---|---|
| `GET` | `/health` | Implementado. Devuelve `{status, model, embedding_model, kb_chunks}`. |
| `POST` | `/api/v1/ask` | Implementado. Devuelve `{answer, sources[]}`. |
| `GET/POST/PATCH` | `/api/v1/pqrsd...` | Implementado, pero requiere `DATABASE_URL`. Sin base devuelve `503`. |
| `POST` | `/api/v1/transcribe` | **No implementado**. La transcripción de voz usa el navegador. |
| `POST` | `/v1/tts` | **No implementado**. La voz usa Web Speech API. |
| `POST` | `/api/v1/feedback` | **No implementado**. La calificación queda solo en `localStorage`. |

### Endpoints disponibles en el backend

| Método | Ruta |
|---|---|
| `GET` | `/health` |
| `POST` | `/api/v1/ask` |
| `POST` | `/api/v1/ask/stream` |
| `POST` | `/api/v1/sync-kb` |
| `POST` | `/api/v1/pqrsd` |
| `GET` | `/api/v1/pqrsd` |
| `GET` | `/api/v1/pqrsd/{radicado}` |
| `PATCH` | `/api/v1/pqrsd/{radicado}` |
| `POST` | `/api/v1/pqrsd/{radicado}/anexos` |

El frontend usa `/api/v1/ask` (no streaming). Los cinco endpoints de PQRSD requieren `DATABASE_URL` y PostgreSQL 13+ con `pg_trgm`; sin esa configuración responden `503`.

---

## 10. Verificación

```bash
# Tipos y build
npm run type-check
npm run build

# Backend vivo
curl -s http://localhost:8000/health

# Consulta RAG
curl -s -X POST http://localhost:8000/api/v1/ask \
  -H 'Content-Type: application/json' \
  -d '{"question":"¿Cuál es el horario de atención?"}'
```

Prueba manual:

1. Abrir `http://localhost:5173`.
2. Enviar una pregunta del dominio logístico.
3. Verificar que la respuesta incluya fuentes RAG.
4. Detener el backend y enviar otra pregunta: debe aparecer un error explícito, nunca una respuesta genérica.
5. En `/stats`, la consulta exitosa debe figurar como `backend` y la fallida como `error`.

---

## 11. Estado actual observado

| Componente | Estado |
|---|---|
| Backend `:8000` | Operativo |
| `/health` | `{"status":"ok","model":"qwen2.5:1.5b","embedding_model":"nomic-embed-text","kb_chunks":633}` |
| Modelo de chat efectivo | `qwen2.5:1.5b` (definido en el `.env` del backend; el default documentado es `qwen2.5:3b-instruct-q4_K_M`) |
| Embeddings | `nomic-embed-text` |
| Ollama | `0.40.13` en `:11434` |
| PQRSD | `503` — `DATABASE_URL` no está configurada en el `.env` del backend |
| Frontend `:5173` | Se levanta con `npm run dev` |

El modelo de 1.5B prioriza velocidad en CPU; para respuestas de mayor calidad, cambiar `OLLAMA_MODEL` en el `.env` del backend a `qwen2.5:3b-instruct-q4_K_M` y reiniciar la API.

---

## 12. Limitaciones conocidas

- **Endpoints faltantes:** TTS neuronal, transcripción y feedback no existen en el backend actual. El frontend los llama y muestra el error o usa el fallback del navegador según el caso.
- **PQRSD requiere base de datos:** los cinco endpoints de `/api/v1/pqrsd` existen, pero sin `DATABASE_URL` responden `503`. Para habilitarlos, levanta PostgreSQL (`docker compose up -d postgres`), agrega `DATABASE_URL` al `.env` del backend y ejecuta `python scripts/dev.py db-init --seed`.
- **Sin CORS en el backend:** las llamadas deben pasar por el proxy de Vite o usar rutas relativas. Una URL absoluta a `:8000` puede ser bloqueada por el navegador.
- **Datos estáticos:** `src/stores/lawyers.ts` contiene servicios de ejemplo; el backend no expone `/lawyers`. La vista de Servicios no depende de la API.
- **Sin tests automatizados:** no hay Vitest ni suite equivalente. La validación es `vue-tsc`, build y pruebas manuales.
- **Latencia:** en CPU-only una respuesta RAG puede tardar decenas de segundos. El frontend usa la variante no streaming de `/api/v1/ask`.
- **El backend no devuelve `neural_tts`:** el camino de TTS neuronal nunca se activa; la voz siempre usa Web Speech API.

---

## 13. Solución de problemas

| Síntoma | Causa probable | Acción |
|---|---|---|
| "No se pudo conectar con el backend" | FastAPI no está corriendo o el puerto no es `8000`. | `python scripts/dev.py api` y `curl localhost:8000/health`. |
| `503` en el chat con `Ollama unavailable` | Ollama no está corriendo o no tiene el modelo. | `ollama serve` y `python scripts/dev.py models`. |
| `503` en PQRSD con `Relational database is not configured` | Falta `DATABASE_URL` en el `.env` del backend. | `docker compose up -d postgres`, agregar `DATABASE_URL` y ejecutar `python scripts/dev.py db-init --seed`. |
| Respuestas de rechazo ("No tengo esa información...") | Índice vacío o pregunta fuera del corpus. | `python scripts/dev.py ingest` y verificar `kb_chunks`. |
| El navegador no abre en `:5173` | Puerto ocupado. | `npm run dev -- --port 5174`. |
| Error de CORS en `/feedback` | `VITE_API_BASE_URL` absoluta. | Usar `/api/v1` relativo o configurar CORS en el backend. |
| Cambios en `.env` no se aplican | Vite solo lee `.env` al arrancar. | Reiniciar `npm run dev`. |

---

## 14. Documentación relacionada

- `AGENTS.md` — reglas de arquitectura, invariantes y estado actual para agentes.
- `../../backend-translogix/README.md` — instalación, variables y endpoints del backend.
- `../../backend-translogix/AGENTS.md` — contrato técnico del RAG y de PQRSD.

---

## 15. Créditos

**TransLogix Colombia S.A.S.** — NIT 901.684.329-8.
Asistente: **Remi**.
