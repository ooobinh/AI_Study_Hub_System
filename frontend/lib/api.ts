export function getApiUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "")
  }

  if (typeof window !== "undefined" && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8080`
  }

  return "http://localhost:8080"
}

export const SESSION_TOKEN_KEY = "aiStudyHubToken"

export function getSessionToken() {
  if (typeof window === "undefined") {
    return null
  }
  return localStorage.getItem(SESSION_TOKEN_KEY)
}

let sessionExpiredHandler: (() => void) | null = null

export function setSessionExpiredHandler(handler: (() => void) | null) {
  sessionExpiredHandler = handler
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers ?? undefined)
  const token = getSessionToken()

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(input, {
    ...init,
    headers,
  })

  if (response.status === 401 && token) {
    sessionExpiredHandler?.()
  }

  return response
}

export function getNetworkErrorMessage(error: unknown) {
  if (error instanceof TypeError) {
    return "Could not connect to the backend. Start the backend on port 8080 and try again."
  }

  return error instanceof Error ? error.message : "Backend connection failed"
}
