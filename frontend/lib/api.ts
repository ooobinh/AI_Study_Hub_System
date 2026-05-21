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

export function getNetworkErrorMessage(error: unknown) {
  if (error instanceof TypeError) {
    return "Could not connect to the backend. Start the backend on port 8080 and try again."
  }

  return error instanceof Error ? error.message : "Backend connection failed"
}
