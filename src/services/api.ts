// Esto envia las peticiones la Backend con Credentials: 'include'
// para que la cookie httpOnly de la sesion en la BD V viaje automaticamente
// sin usa localStorage //

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: Record<string, unknown>
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Envía la cookie httpOnly de la sesión en ChromaDB
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
    },
  })

  if (response.status === 204) {
    return { success: true, data: {} as T }
  }

  const json = await response.json()
  if (!response.ok) {
    throw new Error(json?.error?.message || 'Error en la comunicación con el servidor')
  }
  return json
}