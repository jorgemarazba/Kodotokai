import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// Uvicorn binds IPv4 loopback only, and Windows resolves `localhost` to `::1`
// alone, so the proxy target must be the literal IPv4 address.
const BACKEND_TARGET = 'http://127.0.0.1:8000'

function backendProxy(): ProxyOptions {
  return {
    target: BACKEND_TARGET,
    changeOrigin: true,
    secure: false,
    configure: (proxy) => {
      proxy.on('error', (_err, _req, res) => {
        if ('writeHead' in res && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ detail: `Backend no disponible en ${BACKEND_TARGET}` }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    open: true,
    port: 5173,
    proxy: {
      '/health': backendProxy(),
      '/api': backendProxy(),
      '/v1': backendProxy(),
    },
  },
})