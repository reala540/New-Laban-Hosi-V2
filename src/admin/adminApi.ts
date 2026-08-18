/**
 * Small fetch wrapper for the admin panel. Every request carries the
 * X-Admin-Request header the server requires on mutations (CSRF defence).
 * The session cookie is sent automatically (same origin, HttpOnly).
 */

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T = unknown>(
  url: string,
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Request': '1'
    },
    body: body ? JSON.stringify(body) : undefined
  })

  let data: Record<string, unknown> = {}
  try {
    data = await res.json()
  } catch {
    // non-JSON response (e.g. network error page)
  }

  if (!res.ok) {
    throw new ApiError(typeof data.error === 'string' ? data.error : 'Something went wrong', res.status)
  }
  return data as T
}

export const adminApi = {
  get: <T = unknown>(url: string) => request<T>(url, 'GET'),
  post: <T = unknown>(url: string, body?: Record<string, unknown>) => request<T>(url, 'POST', body),
  put: <T = unknown>(url: string, body?: Record<string, unknown>) => request<T>(url, 'PUT', body),
  patch: <T = unknown>(url: string, body?: Record<string, unknown>) => request<T>(url, 'PATCH', body),
  del: <T = unknown>(url: string, body?: Record<string, unknown>) => request<T>(url, 'DELETE', body)
}

/** Reads a File as base64 and uploads it, returning the /api/media URL. */
export function uploadImage(file: File): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('That image is larger than 2 MB. Please choose a smaller one.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file'))
    reader.onload = async () => {
      try {
        const result = String(reader.result)
        const dataBase64 = result.slice(result.indexOf(',') + 1)
        resolve(await adminApi.post<{ url: string }>('/api/admin/upload', { dataBase64 }))
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsDataURL(file)
  })
}
