# AGENT.md

Guía de arquitectura, directrices y reglas del proyecto **Kodotokai (TransLogix Colombia - Asesor Remi)** para agentes de IA y desarrolladores.

---

## 1. Visión General del Proyecto

**TransLogix Colombia** es la plataforma tecnológica y logística de **TransLogix Colombia S.A.S.** (NIT 901.684.329-8), asistida por **Remi**, asesor inteligente de transporte, cadena de frío, cotización de fletes y logística integral.

### Stack Tecnológico
- **Framework**: Vue 3 (Composition API con `<script setup lang="ts">`)
- **Herramienta de compilación**: Vite + Rolldown / esbuild
- **Estilos**: Tailwind CSS
- **Gestor de estado**: Pinia (stores modulares)
- **Rutas**: Vue Router 4
- **Iconos**: `lucide-vue-next`
- **Renderizado de Avatar**: HTML5 2D Canvas de alto rendimiento con sincronización labial (*Lip-Sync* parabólico) y animación procedural.

---

## 2. Estructura del Código

```text
Kodotokai/
├── public/
│   └── avatar/
│       └── bot.png               # Textura original del avatar (440x520)
├── src/
│   ├── components/
│   │   ├── avatar/
│   │   │   └── AvatarCanvas.vue  # Renderizado Canvas 2D, respiración, brazos y Lip-Sync
│   │   ├── entry/
│   │   │   └── EntryTabsModal.vue # Modal interactivo de cotización rápida y despacho
│   │   └── layout/
│   │       └── AppSidebar.vue    # Barra lateral responsiva (Inicio, Nueva instancia, Servicios & Transporte, Satisfacción 1-5★)
│   ├── services/
│   │   └── translogixAssistant.ts # Motor inteligente de asesoría logística local (Remi)
│   ├── stores/
│   │   ├── chat.ts               # Motor de conversación, voz, visemas y fallback inteligente
│   │   ├── translogix.ts         # Base de datos oficial: 5 líneas de servicio, 25 rutas, 32 municipios y cálculo de fletes
│   │   ├── stats.ts              # Métricas locales, persistencia en localStorage y sync de 1-5★
│   │   └── session.ts            # Estado de sesión y control de drawer móvil
│   ├── views/
│   │   ├── ChatView.vue          # Vista principal de conversación, subtítulos e input responsivo
│   │   ├── LawyersView.vue       # Portal oficial de Servicios & Transporte (Fletes, Rutas, Peligrosas)
│   │   └── StatsView.vue         # Panel de métricas y desglose de satisfacción de 1 a 5★
│   ├── App.vue                   # Contenedor raíz, barra superior móvil y drawer
│   └── main.ts                   # Inicialización de Vue, Pinia y Router
├── .env.example                  # Plantilla de variables de entorno para Git
└── .gitignore                    # Excluye .env real y archivos de scratch
```

---

## 3. Reglas Críticas e Invariantes

### A. Nombres de Marca e Identidad
1. **Nombre del asistente**: Estrictamente **Remi** (nunca "Remi-915").
2. **Nombre de la empresa**: **TransLogix Colombia** (o **TransLogix Colombia S.A.S.**).
3. **Backend obligatorio**: La aplicación opera bajo una arquitectura cliente-servidor estricta y requiere el backend FastAPI/Ollama en ejecución (`VITE_ENABLE_BACKEND=true`). Si el backend no está disponible o la conexión falla, el sistema debe arrojar un error explícito de conexión en lugar de simular respuestas autónomas locales.

### B. Animación del Avatar y Sincronización Labial (`AvatarCanvas.vue`)
1. **Algoritmo de Lip-Sync de la Sonrisa Original**:
   - La boca se proyecta sobre la textura original usando la curva parabólica calibrada:
     $$\text{splitYAtX} = H \times (0.3310 - 0.0095 \times dx^2)$$
   - Con cavidad de gradiente cálido (`#2e0c0c` a `#6d1a24`), visualización de dientes y visemas reactivos (`aa`, `ee`, `ih`, `oh`, `ou`, `sil`).
2. **Animación en Tiempo Real (60 FPS)**:
   - Respiración procedural armónica, pestañeo natural y movimientos de cabeza/manos reactivos a las emociones (`happy`, `empatia`, `serio`).

### C. Fórmulas Oficiales de Cotización Logística
- **Peso Volumétrico (kg)**:
  $$\text{VolWeight} = \frac{\text{Largo} \times \text{Ancho} \times \text{Alto}}{4000}$$
- **Peso Facturable**:
  $$\text{BillableWeight} = \max(\text{Peso Real}, \text{VolWeight})$$
- **Flete Total**:
  $$\text{Flete Total} = \text{Flete Base} + \max(1\% \text{ Valor Declarado}, \$2.500\text{ COP}) + \text{Sobretasas}$$
  *(Sobretasa Cadena de Frío: +25% sobre el flete base; Sobretasa Carga Peligrosa: \$45.000 / \$50.000 COP).*
