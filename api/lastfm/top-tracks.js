import axios from 'axios'
import { handleCors } from '../utils/cors.js'
import { rateLimit } from '../utils/rateLimit.js'
import { getCacheKey, getCachedData, setCachedData } from '../utils/cache.js'

// Configure axios defaults for proper User-Agent (Last.fm requirement)
axios.defaults.headers.common['User-Agent'] = 'audio.fm/1.0.0 (https://github.com/fromis-9/audio-fm)'

const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/'

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Apply rate limiting
  if (!rateLimit(req, res)) return

  try {
    const { username, period = '1month', limit = 50 } = req.query
    const LASTFM_API_KEY = process.env.VITE_LASTFM_API_KEY
    
    if (!LASTFM_API_KEY || LASTFM_API_KEY === 'YOUR_LASTFM_API_KEY') {
      return res.status(400).json({ 
        error: 'Last.fm API key not configured',
        demo: true 
      })
    }

    // Check cache first
    const cacheKey = getCacheKey('lastfm-tracks', { username, period, limit })
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.log(`📦 Serving cached Last.fm data for ${username}`)
      return res.json(cachedData)
    }

    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: 'user.gettoptracks',
        user: username,
        api_key: LASTFM_API_KEY,
        format: 'json',
        period: period,
        limit: limit
      }
    })

    if (response.data.error) {
      throw new Error(response.data.message || 'Last.fm API error')
    }

    const tracks = response.data.toptracks?.track || []
    
    // Cache the successful response
    setCachedData(cacheKey, tracks)
    console.log(`💾 Cached Last.fm data for ${username}`)

    res.json(tracks)
  } catch (error) {
    console.error('Last.fm API error:', error.message)
    
    // Return error but allow frontend to handle fallbacks
    if (error.response?.status === 404) {
      res.status(404).json({ 
        error: 'User not found',
        userNotFound: true 
      })
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch tracks from Last.fm',
        details: error.message 
      })
    }
  }
} 