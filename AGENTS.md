# AGENTS.md

Guía de arquitectura, directrices y reglas del proyecto **Kodotokai (TransLogix Colombia — Asesor Remi)** para agentes de IA y desarrolladores.

---

## 1. Estado actual del proyecto

- **Modo backend-only:** el frontend depende de la API FastAPI para todas las respuestas del asistente.
- **Sin fallback local de chat:** se eliminó `src/services/translogixAssistant.ts` y la variable `VITE_ENABLE_BACKEND`.
- **Errores visibles:** todo fallo de red o de la API se muestra en el chat como un mensaje de error con estilo propio y se registra en estadísticas con origen `error`.
- **Proxy honesto:** Vite devuelve `502` cuando el backend no está disponible; ya no simula `200`.
- **Backend externo:** vive en un repositorio separado (en este entorno: `../../backend-translogix`) con FastAPI + ChromaDB + Ollama y una capa relacional opcional para PQRSD.
- **PQRSD opcional:** los endpoints existen, pero requieren `DATABASE_URL`; sin ella responden `503` y el frontend muestra ese error.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup lang="ts">`) |
| Build | Vite 8 |
| Estilos | Tailwind CSS 4 |
| Estado | Pinia |
| Rutas | Vue Router |
| Iconos | `lucide-vue-next` |
| Avatar | Canvas 2D con lip-sync y animación procedural |
| Backend | FastAPI + ChromaDB + Ollama (repositorio hermano) |

---

## 3. Estructura del código

```text
Kodotokai/
├── public/
│   └── avatar/                     # Texturas del avatar y recursos visuales
├── src/
│   ├── components/
│   │   ├── avatar/AvatarCanvas.vue # Renderizado Canvas 2D, respiración, brazos y lip-sync
│   │   ├── entry/EntryTabsModal.vue
│   │   ├── layout/AppSidebar.vue
│   │   └── pqrsd/PqrsdModal.vue
│   ├── services/
│   │   ├── elevenlabs.ts           # Cliente ElevenLabs TTS, sanitización, caché IndexedDB y cola streaming
│   │   └── pqrsd.ts                # Cliente de /api/v1/pqrsd
│   ├── stores/
│   │   ├── chat.ts                 # Conversación, voz, errores de API y estado del backend
│   │   ├── lawyers.ts              # Datos estáticos de servicios
│   │   ├── pqrsd.ts
│   │   ├── session.ts
│   │   ├── stats.ts                # Métricas locales: backend vs error
│   │   └── translogix.ts           # Rutas, tarifas y catálogos
│   ├── views/
│   │   ├── ChatView.vue
│   │   ├── LawyersView.vue
│   │   └── StatsView.vue
│   ├── App.vue
│   ├── main.ts
│   └── router/index.ts
├── odd/tasks/                      # Documentos de trabajo ODD
├── .env.example
├── AGENTS.md
├── README.md
└── vite.config.ts
```

---

## 4. Reglas críticas e invariantes

### A. Identidad de marca

1. **Nombre del asistente:** estrictamente **Remi** (nunca "Remi-915").
2. **Nombre de la empresa:** **TransLogix Colombia** o **TransLogix Colombia S.A.S.**
3. **Tono de la interfaz:** español neutro/profesional. El código, identificadores y comentarios van en inglés.

### B. Backend obligatorio (no negociable)

1. Ninguna respuesta del asistente puede generarse localmente. Todas provienen de `POST /api/v1/ask`.
2. No reintroducir `generateTranslogixResponse`, `src/services/translogixAssistant.ts` ni un conmutador tipo `VITE_ENABLE_BACKEND`.
3. No volver a simular respuestas `200` en el proxy de Vite ante fallos del backend.
4. Los errores de la API deben:
   - renderizarse en el chat con `ChatMessage.error`;
   - conservar el `status` HTTP y el `detail` devuelto por FastAPI;
   - registrarse en `stats` con origen `error`;
   - mostrar un mensaje accionable (backend, Ollama, validación o respuesta inválida).
5. El único fallback permitido es de **voz**: Web Speech API cuando el TTS neuronal no está disponible. No aplica a respuestas de chat.
6. `checkBackendHealth()` actualiza `backendStatus` (`unknown`, `online`, `offline`) y alimenta el indicador del panel derecho.

### C. Contrato de error del chat

| Condición | Tratamiento |
|---|---|
| `fetch` rechazado | `connectionErrorMessage()` y estado `offline`. |
| `502`/`504` del proxy | Mensaje de backend no disponible y estado `offline`. |
| `503` de FastAPI | Mensaje de servicio no disponible; el `detail` identifica Ollama o `DATABASE_URL`. El backend sigue `online`. |
| `422` | Mensaje de validación con `detail` y categorías disponibles. |
| `500` | Mensaje de fallo interno; el backend sigue `online`. |
| `200` sin `answer` | Mensaje de respuesta inválida. |
| PQRSD `404` | Mensaje de radicado no encontrado. |

### D. Animación del avatar y lip-sync (`AvatarCanvas.vue`)

1. **Algoritmo de lip-sync de la sonrisa original:**
   - La boca se proyecta sobre la textura original con la curva parabólica calibrada:
     $$\text{splitYAtX} = H \times (0.3310 - 0.0095 \times dx^2)$$
   - Cavidad con gradiente cálido (`#2e0c0c` a `#6d1a24`), dientes y visemas reactivos (`aa`, `ee`, `ih`, `oh`, `ou`, `sil`).
2. **Animación en tiempo real (60 FPS):**
   - Respiración procedural armónica, pestañeo natural y movimientos de cabeza/manos reactivos a las emociones (`happy`, `empatia`, `serio`).
3. **Estado del avatar:** el badge del canvas muestra el estado de animación (`Listo`, `Hablando`, `Escuchando`, `Cotizando`). El estado del backend se muestra aparte, en `ChatView.vue`.

### E. Fórmulas oficiales de cotización logística

- **Peso volumétrico (kg):**
  $$\text{VolWeight} = \frac{\text{Largo} \times \text{Ancho} \times \text{Alto}}{4000}$$

- **Peso facturable:**
  $$\text{BillableWeight} = \max(\text{Peso Real}, \text{VolWeight})$$

- **Flete total:**
  $$\text{Flete Total} = \text{Flete Base} + \max(1\% \text{ Valor Declarado}, \$2.500\text{ COP}) + \text{Sobretasas}$$

  Sobretasa cadena de frío: **+25 %** sobre el flete base.
  Sobretasa carga peligrosa: **\$45.000 / \$50.000 COP**.

---

## 5. Variables de entorno

### Frontend

```env
VITE_API_BASE_URL=/api/v1

# ElevenLabs TTS
VITE_ELEVENLABS_API_KEY=
VITE_ELEVENLABS_VOICE_ID=cjVigY5qzO86Huf0OWal
VITE_ELEVENLABS_MODEL_ID=eleven_flash_v2_5
VITE_ELEVENLABS_ENABLE_CACHE=true
```

- `VITE_API_BASE_URL` debe ser relativa para pasar por el proxy de Vite.
- `VITE_ELEVENLABS_API_KEY` habilita la síntesis neuronal en ElevenLabs.
- `VITE_ELEVENLABS_ENABLE_CACHE` activa el caché persistente en IndexedDB para ahorrar créditos en frases frecuentes y saludos.
- `VITE_ENABLE_BACKEND` fue eliminada.
- `VITE_DEFAULT_AVATAR_URL` y `VITE_APP_TITLE` fueron eliminadas por no tener uso real.
- `.env` está ignorado por Git; `.env.example` es la plantilla versionada.

### Backend

Se definen en `../../backend-translogix/.env` y se cargan desde `api/config.py`:

`API_PORT`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_EMBED_MODEL`, `TEMPERATURE`, `RAG_TOP_K`, `RAG_MAX_DISTANCE`, `RAG_STRONG_DISTANCE`, `LLM_CONCURRENCY_LIMIT`, `EMBED_BATCH_SIZE`, `CHROMA_DB_PATH`, `CHROMA_COLLECTION`, `KNOWLEDGE_BASE_DIR`, `OLLAMA_TIMEOUT`, `OLLAMA_STREAM_TIMEOUT`, `DATABASE_URL`, `DB_POOL_SIZE`, `DB_POOL_TIMEOUT`, `DB_CONNECT_TIMEOUT`, `DB_ECHO`.

`POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB` solo los consume el `docker-compose.yml` del backend. Sin `DATABASE_URL`, el RAG funciona y PQRSD responde `503`.

---

## 6. Contrato de API

### Consumido por el frontend

| Método | Ruta | Estado |
|---|---|---|
| `GET` | `/health` | Implementado. |
| `POST` | `/api/v1/ask/stream` | Implementado. Streaming progresivo de tokens + cabecera `X-Sources-Base64`. |
| `POST` | `/api/v1/ask` | Implementado (ruta de respaldo no-stream). Respuesta `{answer, sources[]}`. |
| `GET/POST/PATCH` | `/api/v1/pqrsd...` | Implementado, pero requiere `DATABASE_URL`; sin base devuelve `503`. |
| `POST` | `/api/v1/transcribe` | **No implementado**. |
| `POST` | `/v1/tts` | **No implementado** (reemplazado por integración directa con ElevenLabs + Web Speech). |
| `POST` | `/api/v1/feedback` | **No implementado**. |

### Expuesto por el backend

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

### Normalización de fuentes RAG

`normalizeRagSources()` en `src/stores/chat.ts` acepta:

- Objetos con `{ content, metadata: { source, seccion, categoria }, distance }`.
- Strings legacy.
- Objetos con `{ lawName, articleNumber, excerpt }`.

No cambiar el contrato sin actualizar el backend y este documento.

---

## 7. Estadísticas

- `QueryOrigin` es `'backend' | 'error'`.
- Las entradas antiguas con origen `local` se migran a `error` al cargar `localStorage`.
- `backendPct` y `errorPct` son excluyentes y suman 100 % de las consultas registradas.
- Los errores no reciben valoración de pulgar arriba/abajo en la UI.

---

## 8. Verificación

No hay suite de tests automatizados. Antes de declarar un cambio terminado:

```bash
npm run type-check
npm run build
```

El proxy de desarrollo apunta a `http://127.0.0.1:8000`, no a `localhost`: en Windows `localhost` resuelve solo a `::1` y uvicorn escucha en IPv4. Si se cambia el destino, conservar la dirección literal.

Verificación funcional:

```bash
# Backend vivo
curl -s http://localhost:8000/health

# Consulta RAG
curl -s -X POST http://localhost:8000/api/v1/ask \
  -H 'Content-Type: application/json' \
  -d '{"question":"¿Cuál es el horario de atención?"}'
```

Prueba manual obligatoria:

1. Con backend activo, la respuesta incluye fuentes RAG.
2. Con backend detenido, aparece un error explícito y **nunca** una respuesta genérica.
3. El indicador del panel derecho cambia a **Backend sin conexión**.
4. `/stats` registra la consulta fallida como `error`.

---

## 9. Limitaciones conocidas

- El backend no implementa TTS, transcripción ni feedback.
- PQRSD requiere `DATABASE_URL` y PostgreSQL 13+ con `pg_trgm`; sin esa configuración responde `503`. Para habilitarlo: `docker compose up -d postgres`, agregar `DATABASE_URL` al `.env` del backend y ejecutar `python scripts/dev.py db-init --seed`.
- El backend no configura CORS; usar el proxy de Vite o rutas relativas.
- `src/stores/lawyers.ts` contiene datos estáticos; el backend no expone `/lawyers`.
- El modelo de chat efectivo puede diferir del default documentado según el `.env` del backend.
- En CPU-only las respuestas RAG pueden tardar decenas de segundos.
- El frontend consume prioritariamente `/api/v1/ask/stream` para streaming en vivo de tokens y síntesis TTS progresiva; conmuta a `/api/v1/ask` si el streaming no está disponible.

---

## 10. Convenciones

- Documentación en español neutro; código y comentarios en inglés.
- No agregar dependencias sin justificar la necesidad.
- No commitear `.env`, `chroma_db/`, modelos ni cachés.
- Mantener el backend en su repositorio; este proyecto solo consume la API.
- Los cambios de comportamiento deben actualizar `README.md`, `AGENTS.md` y `odd/tasks/` en el mismo work unit.
