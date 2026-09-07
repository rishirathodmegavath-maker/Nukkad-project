import { getStoredSession, persistSession, clearSession } from '@/lib/session'
import type { Session } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!BASE_URL) {
  // Fails loud in dev rather than silently hitting a relative/undefined URL.
  throw new Error('VITE_API_BASE_URL is not set — copy .env.example to .env.local')
}

export class ApiError extends Error {
  status: number
  errorCode?: string

  constructor(message: string, status: number, errorCode?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errorCode = errorCode
  }
}

interface Envelope<T> {
  success: boolean
  data: T
  message?: string | null
}

interface ErrorEnvelope {
  success: false
  message: string
  errorCode: string
  timestamp: string
  path: string
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/** Thrown when the refresh *request itself* couldn't be made (offline, dropped signal, DNS hiccup)
 * — distinct from the server actually rejecting the refresh token, so callers don't destroy an
 * otherwise-valid session over a transient connectivity blip. */
class RefreshNetworkError extends Error {}

/** In-flight refresh is de-duplicated so N parallel 401s trigger exactly one refresh call. */
let refreshPromise: Promise<Session> | null = null

async function refreshAccessToken(currentRefreshToken: string): Promise<Session> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      let response: Response
      try {
        response = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
        })
      } catch {
        throw new RefreshNetworkError('Network error while refreshing session')
      }
      const body = await response.json().catch(() => null)
      if (!response.ok || !body?.success) {
        throw new ApiError(body?.message ?? 'Session expired', response.status, body?.errorCode)
      }
      const previous = getStoredSession()
      const session: Session = {
        userId: previous?.userId ?? '',
        name: previous?.name ?? '',
        onboardingCompleted: previous?.onboardingCompleted ?? true,
        token: body.data.accessToken,
        refreshToken: body.data.refreshToken,
        expiresAt: new Date(Date.now() + body.data.expiresIn * 1000).toISOString(),
      }
      persistSession(session)
      return session
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  /** Internal: prevents infinite retry loops on a repeatedly-401ing request. */
  _isRetry?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = getStoredSession()
  const headers: Record<string, string> = { ...options.headers }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (session?.token) headers.Authorization = `Bearer ${session.token}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError('Network error — is the backend running?', 0)
  }

  // Refresh-on-401 and retry once. Never applies to the refresh/login calls themselves.
  if (
    response.status === 401 &&
    !options._isRetry &&
    session?.refreshToken &&
    !path.startsWith('/auth/refresh') &&
    !path.startsWith('/auth/login')
  ) {
    try {
      await refreshAccessToken(session.refreshToken)
    } catch (err) {
      if (err instanceof RefreshNetworkError) {
        throw new ApiError('Network error — is the backend running?', 0)
      }
      clearSession()
      if (typeof window !== 'undefined') window.location.assign('/login')
      throw new ApiError('Session expired — please log in again', 401, 'UNAUTHORIZED')
    }
    return request<T>(path, { ...options, _isRetry: true })
  }

  const body = (await response.json().catch(() => null)) as Envelope<T> | ErrorEnvelope | null

  if (!response.ok || !body || body.success === false) {
    const errorBody = body as ErrorEnvelope | null
    throw new ApiError(errorBody?.message ?? `Request failed (${response.status})`, response.status, errorBody?.errorCode)
  }

  return (body as Envelope<T>).data
}

export const apiClient = {
  get: <T>(path: string, headers?: Record<string, string>) => request<T>(path, { method: 'GET', headers }),
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) => request<T>(path, { method: 'POST', body, headers }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string, headers?: Record<string, string>) => request<T>(path, { method: 'DELETE', headers }),
}

/** Mirrors the backend's `spring.servlet.multipart.max-file-size` (application.yml) so oversized
 * files are rejected instantly, client-side, instead of after a full upload only to hit a 400. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

/**
 * Multipart upload (e.g. avatar images, resource files) — bypasses the JSON request() path since
 * FormData sets its own Content-Type. `extraFields` are appended alongside the file for endpoints
 * that accept metadata (title, type, tags, ...) in the same multipart request; values of `undefined`
 * are omitted.
 */
export async function uploadFile<T>(
  path: string,
  file: File | null,
  fieldName = 'file',
  extraFields?: Record<string, string | undefined>,
): Promise<T> {
  if (file && file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(`File is too large (${formatMb(file.size)}). Maximum allowed size is ${formatMb(MAX_UPLOAD_BYTES)}.`, 0, 'FILE_TOO_LARGE')
  }

  const session = getStoredSession()
  const formData = new FormData()
  if (file) formData.append(fieldName, file)
  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) {
      if (value !== undefined) formData.append(key, value)
    }
  }

  const headers: Record<string, string> = {}
  if (session?.token) headers.Authorization = `Bearer ${session.token}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: formData })
  } catch {
    throw new ApiError('Network error — is the backend running?', 0)
  }

  if (response.status === 401 && session?.refreshToken) {
    try {
      await refreshAccessToken(session.refreshToken)
    } catch (err) {
      if (err instanceof RefreshNetworkError) {
        throw new ApiError('Network error — is the backend running?', 0)
      }
      clearSession()
      if (typeof window !== 'undefined') window.location.assign('/login')
      throw new ApiError('Session expired — please log in again', 401, 'UNAUTHORIZED')
    }
    return uploadFile<T>(path, file, fieldName, extraFields)
  }

  const body = (await response.json().catch(() => null)) as Envelope<T> | ErrorEnvelope | null
  if (!response.ok || !body || body.success === false) {
    const errorBody = body as ErrorEnvelope | null
    throw new ApiError(errorBody?.message ?? `Upload failed (${response.status})`, response.status, errorBody?.errorCode)
  }
  return (body as Envelope<T>).data
}

/**
 * Fetches a paginated endpoint and returns just the content array, so mock-era
 * `listX(): Promise<T[]>` signatures keep working without UI/pagination changes.
 * Requests a generously large page (no infinite scroll yet — a deliberate MVP shim,
 * not a bug: see README).
 */
export async function getPage<T>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T[]> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  if (!query.has('size')) query.set('size', '100')
  const qs = query.toString()
  const page = await apiClient.get<Page<T>>(`${path}${qs ? `?${qs}` : ''}`)
  return page.content
}
