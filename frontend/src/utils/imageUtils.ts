export const API_BASE_URL =
	import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const getFullImageUrl = (path: string | null): string | null => {
  if (!path) return null
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`
  }
  return path
}

export const extractRelativeImagePath = (
  fullUrl: string | null
): string | null => {
  if (!fullUrl) return null
  const parts = fullUrl.split('/')
  return parts[parts.length - 1] || null
}
