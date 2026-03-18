const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

export function getServerBaseUrl() {
  return rawBaseUrl.replace(/\/+$/, "").replace(/\/api$/, "")
}

export function getApiBaseUrl() {
  return `${getServerBaseUrl()}/api`
}
