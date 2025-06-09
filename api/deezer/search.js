import axios from 'axios'
import { handleCors } from '../utils/cors.js'
import { rateLimit } from '../utils/rateLimit.js'

const DEEZER_BASE_URL = 'https://api.deezer.com'

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
    const { artist, track } = req.query
    
    if (!artist || !track) {
      return res.status(400).json({ error: 'Artist and track parameters required' })
    }

    // Clean and format the search query
    const cleanArtist = artist.replace(/[^\w\s]/g, '').trim()
    const cleanTrack = track.replace(/[^\w\s]/g, '').trim()
    const query = `artist:"${cleanArtist}" track:"${cleanTrack}"`

    console.log(`🔍 Searching Deezer: ${query}`)

    const response = await axios.get(`${DEEZER_BASE_URL}/search`, {
      params: {
        q: query,
        limit: 1
      }
    })

    const tracks = response.data?.data || []
    if (tracks.length === 0) {
      // Fallback to simpler search
      const fallbackQuery = `${cleanArtist} ${cleanTrack}`
      console.log(`🔍 Fallback search: ${fallbackQuery}`)
      
      const fallbackResponse = await axios.get(`${DEEZER_BASE_URL}/search`, {
        params: {
          q: fallbackQuery,
          limit: 1
        }
      })
      
      const fallbackTracks = fallbackResponse.data?.data || []
      if (fallbackTracks.length > 0) {
        console.log(`✅ Found track: ${fallbackTracks[0].title} by ${fallbackTracks[0].artist.name}`)
        res.json(fallbackTracks[0])
      } else {
        console.log(`❌ No track found for: ${artist} - ${track}`)
        res.status(404).json({ error: 'Track not found' })
      }
    } else {
      console.log(`✅ Found track: ${tracks[0].title} by ${tracks[0].artist.name}`)
      res.json(tracks[0])
    }
  } catch (error) {
    console.error('Deezer API error:', error.message)
    res.status(500).json({ 
      error: 'Failed to search Deezer',
      details: error.message 
    })
  }
} 