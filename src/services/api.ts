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

// Mientras el backend solo tenga /v1/chat y /v1/chat/stream,
// devolvemos respuesta controlada sin lanzar errores rojos en la consola del navegador.
export async function apiRequest<T>(
  _endpoint: string,
  _options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return {
    success: false,
    data: {} as T,
  }
}