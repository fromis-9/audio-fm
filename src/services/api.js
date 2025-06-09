import axios from 'axios'

// Backend API base URL (adjust for development vs production)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

// Check if we're in demo mode by checking the backend health
let IS_DEMO_MODE = false
let DEMO_CHECK_DONE = false

async function checkDemoMode() {
  if (DEMO_CHECK_DONE) return IS_DEMO_MODE
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`)
    IS_DEMO_MODE = !response.data.lastfmKey
    console.log('Backend mode:', IS_DEMO_MODE ? 'Demo (no API key)' : 'Production (API key set)')
  } catch (error) {
    console.log('Backend not available, using frontend demo mode')
    IS_DEMO_MODE = true
  }
  
  DEMO_CHECK_DONE = true
  return IS_DEMO_MODE
}

export const lastfmApi = {
  async getTopTracks(username, period = '1month', limit = 50) {
    await checkDemoMode()
    
    // If backend is not available, fall back to demo data
    if (IS_DEMO_MODE) {
      console.warn('Demo mode: Using sample data')
      return [
        {
          name: 'Bohemian Rhapsody',
          artist: { name: 'Queen' },
          playcount: '150'
        },
        {
          name: 'Hotel California',
          artist: { name: 'Eagles' },
          playcount: '120'
        },
        {
          name: 'Stairway to Heaven',
          artist: { name: 'Led Zeppelin' },
          playcount: '100'
        },
        {
          name: 'Sweet Child O Mine',
          artist: { name: 'Guns N Roses' },
          playcount: '85'
        },
        {
          name: 'Smells Like Teen Spirit',
          artist: { name: 'Nirvana' },
          playcount: '75'
        }
      ]
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/lastfm/top-tracks`, {
        params: {
          username,
          period,
          limit
        }
      })

      return response.data
    } catch (error) {
      console.error('Last.fm API error:', error)
      
      // Fallback to demo data for user not found or API errors
      if (error.response?.status === 404 && error.response?.data?.userNotFound) {
        console.warn('User not found, falling back to demo data')
        return [
          { name: 'Bohemian Rhapsody', artist: { name: 'Queen' }, playcount: '150' },
          { name: 'Hotel California', artist: { name: 'Eagles' }, playcount: '120' },
          { name: 'Stairway to Heaven', artist: { name: 'Led Zeppelin' }, playcount: '100' },
          { name: 'Sweet Child O Mine', artist: { name: 'Guns N Roses' }, playcount: '85' },
          { name: 'Smells Like Teen Spirit', artist: { name: 'Nirvana' }, playcount: '75' }
        ]
      }
      
      throw new Error('Failed to fetch tracks from Last.fm. Please try again.')
    }
  }
}

export const deezerApi = {
  async searchTrack(artist, track) {
    await checkDemoMode()
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/deezer/search`, {
        params: {
          artist,
          track
        }
      })

      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`No Deezer track found for: ${artist} - ${track}`)
        return null
      }
      
      console.error('Deezer API error:', error)
      return null
    }
  }
}

export const ttsService = {
  // For now, we'll use the Web Speech API (built into browsers)
  // In production, you might want to use ElevenLabs or Google TTS API
  async generateSpeech(text) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.log('TTS not supported, skipping')
        resolve()
        return
      }

      // Cancel any existing speech
      speechSynthesis.cancel()
      
      // Wait a bit after cancel to avoid conflicts
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1.0
        utterance.pitch = 1
        utterance.volume = 1

        // Try to find a good English voice
        const voices = speechSynthesis.getVoices()
        if (voices.length > 0) {
          const englishVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.includes('Google') || voice.name.includes('Microsoft'))
          ) || voices.find(voice => voice.lang.startsWith('en'))

          if (englishVoice) {
            utterance.voice = englishVoice
          }
        }

        // Timeout based on text length
        const estimatedDuration = Math.max(4000, text.length * 100) // 100ms per character, minimum 4 seconds
        const timeout = setTimeout(() => {
          console.log('TTS timeout, continuing to audio')
          speechSynthesis.cancel()
          resolve()
        }, estimatedDuration)

        utterance.onend = () => {
          console.log('TTS completed')
          clearTimeout(timeout)
          resolve()
        }
        
        utterance.onerror = (error) => {
          console.warn('TTS error (continuing anyway):', error)
          clearTimeout(timeout)
          resolve() // Resolve anyway to continue to audio
        }

        console.log('Starting TTS speech')
        try {
          speechSynthesis.speak(utterance)
        } catch (speakError) {
          console.warn('TTS speak failed, continuing to audio:', speakError)
          clearTimeout(timeout)
          resolve()
        }
      }, 100)
    })
  }
} 