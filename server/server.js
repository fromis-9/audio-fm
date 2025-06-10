import express from 'express'
import cors from 'cors'
import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// ES module setup
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3002

// Middleware
app.use(cors())
app.use(express.json())

// API endpoints
const LASTFM_API_KEY = process.env.VITE_LASTFM_API_KEY
const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/'
const DEEZER_BASE_URL = 'https://api.deezer.com'

// Configure axios defaults for proper User-Agent (Last.fm requirement)
axios.defaults.headers.common['User-Agent'] = 'audio.fm/1.0.0 (https://github.com/fromis-9/audio-fm)'

// Token bucket rate limiting - allows bursts but prevents abuse
const rateLimitMap = new Map()
const BURST_LIMIT = 60 // Allow up to 60 requests in a burst (accounts for React dev mode double-execution)
const REFILL_RATE = 15 // Refill 15 tokens per second
const REFILL_INTERVAL = 1000 // Check every second

// Simple caching to reduce API calls
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const getCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`
}

const getCachedData = (key) => {
  const cached = cache.get(key)
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }
  return null
}

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

const rateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress
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
    return res.status(429).json({ 
      error: 'Rate limit exceeded. Please wait before making another request.',
      retryAfter: Math.ceil((REFILL_INTERVAL - (timePassed % REFILL_INTERVAL)) / 1000)
    })
  }
  
  // Consume a token
  bucket.tokens -= 1
  next()
}

// Last.fm API proxy with rate limiting
app.get('/api/lastfm/top-tracks', rateLimit, async (req, res) => {
  try {
    const { username, period = '1month', limit = 50 } = req.query
    
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
})

// Custom date range endpoint - gets recent tracks and calculates top tracks
app.get('/api/lastfm/top-tracks-range', rateLimit, async (req, res) => {
  try {
    const { username, from, to, limit = 50 } = req.query
    
    if (!LASTFM_API_KEY || LASTFM_API_KEY === 'YOUR_LASTFM_API_KEY') {
      return res.status(400).json({ 
        error: 'Last.fm API key not configured',
        demo: true 
      })
    }

    if (!from || !to) {
      return res.status(400).json({ error: 'Both from and to timestamps are required' })
    }

    // Check cache first
    const cacheKey = getCacheKey('lastfm-tracks-range', { username, from, to, limit })
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.log(`📦 Serving cached Last.fm range data for ${username}`)
      return res.json(cachedData)
    }

    console.log(`🔍 Fetching tracks for ${username} from ${new Date(from * 1000).toDateString()} to ${new Date(to * 1000).toDateString()}`)

    // Fetch all recent tracks within the date range
    let allTracks = []
    let page = 1
    const maxPages = 10 // Limit to prevent excessive API calls
    
    while (page <= maxPages) {
      console.log(`📄 Fetching page ${page} for ${username}`)
      
      const response = await axios.get(LASTFM_BASE_URL, {
        params: {
          method: 'user.getrecenttracks',
          user: username,
          api_key: LASTFM_API_KEY,
          format: 'json',
          from: from,
          to: to,
          limit: 1000, // Max per page
          page: page
        }
      })

      if (response.data.error) {
        throw new Error(response.data.message || 'Last.fm API error')
      }

      const tracks = response.data.recenttracks?.track || []
      
      // If tracks is not an array (single track), make it an array
      const tracksArray = Array.isArray(tracks) ? tracks : [tracks]
      
      // Filter out "now playing" tracks (they don't have a date)
      const validTracks = tracksArray.filter(track => track.date)
      
      if (validTracks.length === 0) {
        break // No more tracks
      }
      
      allTracks = allTracks.concat(validTracks)
      
      // Check if there are more pages
      const totalPages = parseInt(response.data.recenttracks['@attr']?.totalPages || 1)
      if (page >= totalPages) {
        break
      }
      
      page++
      
      // Add delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`📊 Processing ${allTracks.length} tracks for ${username}`)

    // Count track occurrences
    const trackCounts = new Map()
    
    allTracks.forEach(track => {
      const artist = track.artist?.name || track.artist?.['#text'] || track.artist || 'Unknown Artist'
      const trackName = track.name || 'Unknown Track'
      const key = `${artist}|||${trackName}` // Use ||| as separator to avoid conflicts
      
      if (trackCounts.has(key)) {
        const existing = trackCounts.get(key)
        existing.playcount++
      } else {
        trackCounts.set(key, {
          name: trackName,
          artist: { name: artist },
          playcount: 1,
          image: track.image || [],
          url: track.url || ''
        })
      }
    })

    // Convert to array and sort by playcount
    const topTracks = Array.from(trackCounts.values())
      .sort((a, b) => b.playcount - a.playcount)
      .slice(0, parseInt(limit))
      .map(track => ({
        ...track,
        playcount: track.playcount.toString() // Keep consistent with regular API
      }))

    console.log(`🎵 Top ${topTracks.length} tracks calculated for ${username}`)
    
    // Cache the successful response
    setCachedData(cacheKey, topTracks)
    console.log(`💾 Cached Last.fm range data for ${username}`)

    res.json(topTracks)
  } catch (error) {
    console.error('Last.fm API range error:', error.message)
    
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
})

// Deezer API proxy with rate limiting
app.get('/api/deezer/search', rateLimit, async (req, res) => {
  try {
    const { artist, track } = req.query
    
    if (!artist || !track) {
      return res.status(400).json({ error: 'Artist and track parameters required' })
    }

    // Better cleaning that preserves CJK characters and other Unicode
    const cleanText = (text) => {
      return text
        .replace(/[""'']/g, '"') // Normalize quotes
        .replace(/[–—]/g, '-') // Normalize dashes
        .replace(/[\[\](){}]/g, '') // Remove brackets and parentheses
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
    }

    const cleanArtist = cleanText(artist)
    const cleanTrack = cleanText(track)

    // Skip search if both artist and track are empty after cleaning
    if (!cleanArtist && !cleanTrack) {
      console.log(`❌ No searchable content for: ${artist} - ${track}`)
      return res.status(404).json({ error: 'Track not found' })
    }

    // Try different search strategies
    const searchStrategies = [
      // Strategy 1: Exact artist and track with quotes
      cleanArtist && cleanTrack ? `artist:"${cleanArtist}" track:"${cleanTrack}"` : null,
      // Strategy 2: Simple search with both terms
      cleanArtist && cleanTrack ? `${cleanArtist} ${cleanTrack}` : null,
      // Strategy 3: Just the track name if artist is empty/problematic
      cleanTrack ? cleanTrack : null,
      // Strategy 4: Just the artist if track is empty/problematic
      cleanArtist ? cleanArtist : null
    ].filter(Boolean) // Remove null strategies

    console.log(`🔍 Searching Deezer for: ${artist} - ${track}`)

    for (let i = 0; i < searchStrategies.length; i++) {
      const query = searchStrategies[i]
      console.log(`🔍 Strategy ${i + 1}: ${query}`)

      try {
        const response = await axios.get(`${DEEZER_BASE_URL}/search`, {
          params: {
            q: query,
            limit: 5 // Get more results to find better matches
          }
        })

        const tracks = response.data?.data || []
        
        if (tracks.length > 0) {
          // Try to find the best match
          let bestMatch = tracks[0] // Default to first result
          
          // Look for better matches if we have both artist and track info
          if (cleanArtist && cleanTrack) {
            const betterMatch = tracks.find(track => {
              const trackArtist = track.artist?.name?.toLowerCase() || ''
              const trackTitle = track.title?.toLowerCase() || ''
              const searchArtist = cleanArtist.toLowerCase()
              const searchTrack = cleanTrack.toLowerCase()
              
              // Check if artist name is similar (for different language variations)
              const artistMatch = trackArtist.includes(searchArtist) || searchArtist.includes(trackArtist)
              const titleMatch = trackTitle.includes(searchTrack) || searchTrack.includes(trackTitle)
              
              return artistMatch || titleMatch
            })
            
            if (betterMatch) {
              bestMatch = betterMatch
            }
          }
          
          console.log(`✅ Found track: ${bestMatch.title} by ${bestMatch.artist.name}`)
          return res.json(bestMatch)
        }
      } catch (searchError) {
        console.log(`❌ Search strategy ${i + 1} failed:`, searchError.message)
        continue
      }
    }

    // If all strategies failed
    console.log(`❌ No track found for: ${artist} - ${track}`)
    res.status(404).json({ error: 'Track not found' })

  } catch (error) {
    console.error('Deezer API error:', error.message)
    res.status(500).json({ 
      error: 'Failed to search Deezer',
      details: error.message 
    })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    lastfmKey: !!LASTFM_API_KEY && LASTFM_API_KEY !== 'YOUR_LASTFM_API_KEY',
    timestamp: new Date().toISOString()
  })
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`🚀 Audio.fm server running on port ${PORT}`)
  console.log(`🔑 Last.fm API key: ${LASTFM_API_KEY ? 'Configured' : 'Missing'}`)
  console.log(`🌐 CORS enabled for frontend development`)
}) 