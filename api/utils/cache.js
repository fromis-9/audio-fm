// Simple caching utility for Vercel API routes
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const getCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`
}

export const getCachedData = (key) => {
  const cached = cache.get(key)
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }
  return null
}

export const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
} 