// Token bucket rate limiting for Vercel API routes
const rateLimitMap = new Map()
const BURST_LIMIT = 100 // Allow up to 100 requests in a burst
const REFILL_RATE = 30 // Refill 30 tokens per second  
const REFILL_INTERVAL = 1000 // Check every second

export const rateLimit = (req, res) => {
  const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
  const now = Date.now()
  
  // Get or create bucket for this IP
  let bucket = rateLimitMap.get(clientIP)
  if (!bucket) {
    bucket = {
      tokens: BURST_LIMIT,
      lastRefill: now
    }
    rateLimitMap.set(clientIP, bucket)
  }
  
  // Refill tokens based on time passed
  const timePassed = now - bucket.lastRefill
  const tokensToAdd = Math.floor(timePassed / REFILL_INTERVAL) * REFILL_RATE
  bucket.tokens = Math.min(BURST_LIMIT, bucket.tokens + tokensToAdd)
  bucket.lastRefill = now
  
  // Check if request can proceed
  if (bucket.tokens < 1) {
    res.status(429).json({ 
      error: 'Rate limit exceeded. Please wait before making another request.',
      retryAfter: Math.ceil((REFILL_INTERVAL - (timePassed % REFILL_INTERVAL)) / 1000)
    })
    return false
  }
  
  // Consume a token
  bucket.tokens -= 1
  return true
} 