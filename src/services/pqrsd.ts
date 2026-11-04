/**
 * Servicio cliente para los endpoints de PQRSD del backend local
 * Conecta con el router FastAPI en `/api/v1/pqrsd`
 */

export type EstadoPQRSD =
  | 'recibida'
  | 'en_tramite'
  | 'respondida'
  | 'vencida'
  | 'cerrada'
  | 'archivada'

export interface PqrsdEvento {
  id: number
  estado_anterior?: string | null
  estado_nuevo: string
  usuario_id?: string | null
  nota?: string | null
  ocurrido_en: string
}

export interface PqrsdAnexo {
  id: string
  nombre_archivo: string
  tipo_mime: string
  tamano_bytes: number
  hash_sha256: string
  subido_en: string
}

export interface PqrsdCase {
  id: string
  radicado: string
  tipo_peticion_id: number
  canal_id: number
  dependencia_id: number
  ciudadano_id?: string | null
  usuario_responsable_id?: string | null
  asunto: string
  detalle: string
  estado: EstadoPQRSD
  fecha_radicacion: string
  fecha_vencimiento: string
  dias_restantes: number
  respondida_en?: string | null
  respuesta?: string | null
  eventos: PqrsdEvento[]
  anexos: PqrsdAnexo[]
}

export interface PqrsdCreateInput {
  tipo_peticion_id: number
  canal_id: number
  dependencia_id: number
  ciudadano_id?: string | null
  asunto: string
  detalle: string
  fecha_vencimiento?: string | null
}

export interface PqrsdUpdateInput {
  estado?: EstadoPQRSD | null
  usuario_responsable_id?: string | null
  respuesta?: string | null
  respondida_en?: string | null
}

export interface PqrsdAnexoInput {
  nombre_archivo: string
  tipo_mime: string
  tamano_bytes: number
  hash_sha256: string
  ruta: string
}

export interface ListPqrsdParams {
  estado?: EstadoPQRSD
  dependencia_id?: number
  limit?: number
  offset?: number
}

// Catálogos oficiales extraídos del seed del backend
export const TIPOS_PETICION = [
  { id: 1, codigo: 'informacion_copias', nombre: 'Información y copias o fotocopias de documentos', plazo: 10 },
  { id: 2, codigo: 'consulta_materias', nombre: 'Consulta en relación con materias a cargo de la entidad', plazo: 30 },
  { id: 3, codigo: 'documentos_otras_entidades', nombre: 'Petición de documentos provenientes de otras entidades', plazo: 10 },
  { id: 4, codigo: 'acceso_consulta_documental', nombre: 'Acceso a consulta documental', plazo: 10 },
  { id: 5, codigo: 'asesoria_tecnica_capacitacion', nombre: 'Asesoría técnica y capacitación', plazo: 30 },
  { id: 6, codigo: 'quejas_denuncias', nombre: 'Quejas y denuncias', plazo: 15 },
  { id: 7, codigo: 'reclamos_sugerencias', nombre: 'Reclamos y sugerencias', plazo: 15 },
]

export const CANALES_ATENCION = [
  { id: 1, codigo: 'escrito', nombre: 'Escrito (Correo/Formulario Web)', es_presencial: false },
  { id: 2, codigo: 'presencial', nombre: 'Presencial', es_presencial: true },
  { id: 3, codigo: 'telefonico', nombre: 'Telefónico', es_presencial: false },
  { id: 4, codigo: 'virtual', nombre: 'Virtual (Chat / Web)', es_presencial: false },
]

export const DEPENDENCIAS = [
  { id: 1, codigo: 'atencion_ciudadano', nombre: 'Atención al Ciudadano y Operaciones' },
  { id: 2, codigo: 'logistica_transporte', nombre: 'Logística, Rutas y Flota' },
  { id: 3, codigo: 'juridico_pqrs', nombre: 'Oficina Asesora Jurídica y PQRS' },
]

const BASE_URL = '/api/v1/pqrsd'

export async function createPqrsd(payload: PqrsdCreateInput): Promise<PqrsdCase> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.detail || `Error al radicar PQRSD: HTTP ${res.status}`)
  }

  return res.json()
}

export async function getPqrsd(radicado: string): Promise<PqrsdCase> {
  const cleanRadicado = radicado.trim()
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(cleanRadicado)}`, {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.detail || `PQRSD ${cleanRadicado} no encontrado (${res.status})`)
  }

  return res.json()
}

export async function listPqrsd(params: ListPqrsdParams = {}): Promise<PqrsdCase[]> {
  const query = new URLSearchParams()
  if (params.estado) query.append('estado', params.estado)
  if (params.dependencia_id) query.append('dependencia_id', String(params.dependencia_id))
  if (params.limit) query.append('limit', String(params.limit))
  if (params.offset) query.append('offset', String(params.offset))

  const queryString = query.toString() ? `?${query.toString()}` : ''
  const res = await fetch(`${BASE_URL}${queryString}`, {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.detail || `Error al listar PQRSD (${res.status})`)
  }

  return res.json()
}

export async function updatePqrsd(radicado: string, payload: PqrsdUpdateInput): Promise<PqrsdCase> {
  const cleanRadicado = radicado.trim()
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(cleanRadicado)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.detail || `Error al actualizar PQRSD (${res.status})`)
  }

  return res.json()
}

export async function addAnexoPqrsd(radicado: string, payload: PqrsdAnexoInput): Promise<PqrsdAnexo> {
  const cleanRadicado = radicado.trim()
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(cleanRadicado)}/anexos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.detail || `Error al adjuntar anexo a PQRSD (${res.status})`)
  }

  return res.json()
}
