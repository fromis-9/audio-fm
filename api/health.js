import { handleCors } from './utils/cors.js'

export default function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const LASTFM_API_KEY = process.env.VITE_LASTFM_API_KEY

  res.json({ 
    status: 'ok', 
    lastfmKey: !!LASTFM_API_KEY && LASTFM_API_KEY !== 'YOUR_LASTFM_API_KEY',
    timestamp: new Date().toISOString()
  })
} 