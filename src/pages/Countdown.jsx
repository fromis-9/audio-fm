import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { lastfmApi, deezerApi, ttsService } from '../services/api'

function Countdown() {
  const [searchParams] = useSearchParams()
  const [tracks, setTracks] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [playbackPhase, setPlaybackPhase] = useState('intro') // 'intro' | 'track' | 'demo-info'
  const [viewMode, setViewMode] = useState('list') // 'list' | 'nowplaying'
  
  const audioRef = useRef(null)
  const isLoadingRef = useRef(false) // Prevent double execution in React dev mode
  const fadeIntervalRef = useRef(null) // For fade effects
  const fadeTimeoutRef = useRef(null) // For fade-out timing
  
  const username = searchParams.get('user')
  const period = searchParams.get('period')
  const limit = parseInt(searchParams.get('limit')) || 20

  useEffect(() => {
    if (username && !isLoadingRef.current) {
      fetchAndPreparePlaylist()
    }
  }, [username, period, limit])

  const fetchAndPreparePlaylist = async () => {
    try {
      if (isLoadingRef.current) return // Prevent duplicate calls
      isLoadingRef.current = true
      
      setIsLoading(true)
      setError(null)
      setLoadingProgress(0)

      // Fetch tracks from Last.fm
      const lastfmTracks = await lastfmApi.getTopTracks(username, period, limit)
      setLoadingProgress(20)

      if (!lastfmTracks.length) {
        throw new Error('No tracks found for this user and time period.')
      }

      // Find Deezer previews for each track
      const tracksWithPreviews = []
      console.log('Processing', lastfmTracks.length, 'tracks from Last.fm')
      
      for (let i = 0; i < lastfmTracks.length; i++) {
        const track = lastfmTracks[i]
        const artist = track.artist?.name || track.artist
        const title = track.name
        
        console.log(`Processing track ${i + 1}: ${artist} - ${title}`)

        try {
          const deezerTrack = await deezerApi.searchTrack(artist, title)
          
          if (deezerTrack?.preview) {
            console.log('✅ Found Deezer track with preview')
            tracksWithPreviews.push({
              position: tracksWithPreviews.length + 1,
              title: deezerTrack.title,
              artist: deezerTrack.artist.name,
              album: deezerTrack.album?.title || '',
              cover: deezerTrack.album?.cover_medium || deezerTrack.album?.cover,
              preview: deezerTrack.preview,
              deezerLink: deezerTrack.link,
              playcount: track.playcount
            })
          } else if (deezerTrack) {
            console.log('✅ Found Deezer track but no preview')
            // Track found but no preview available (demo mode)
            tracksWithPreviews.push({
              position: tracksWithPreviews.length + 1,
              title: deezerTrack.title,
              artist: deezerTrack.artist.name,
              album: deezerTrack.album?.title || '',
              cover: deezerTrack.album?.cover_medium || deezerTrack.album?.cover,
              preview: null, // No preview in demo mode
              deezerLink: deezerTrack.link,
              playcount: track.playcount,
              isDemoMode: true
            })
          } else {
            console.log('❌ No Deezer track found, using Last.fm data only')
            // No Deezer track found, use Last.fm data
            tracksWithPreviews.push({
              position: tracksWithPreviews.length + 1,
              title: title,
              artist: artist,
              album: '', // No album info from Last.fm
              cover: track.image?.[2]?.['#text'] || track.image?.[1]?.['#text'] || 'https://via.placeholder.com/250x250?text=No+Cover',
              preview: null,
              deezerLink: null,
              playcount: track.playcount,
              isLastFmOnly: true
            })
          }
        } catch (err) {
          console.log('❌ Deezer API failed, using Last.fm data only:', err.message)
          // Add track anyway with Last.fm data only
          tracksWithPreviews.push({
            position: tracksWithPreviews.length + 1,
            title: title,
            artist: artist,
            album: '', // No album info from Last.fm
            cover: track.image?.[2]?.['#text'] || track.image?.[1]?.['#text'] || 'https://via.placeholder.com/250x250?text=No+Cover', // Use Last.fm image or placeholder
            preview: null, // No preview available
            deezerLink: null, // No Deezer link
            playcount: track.playcount,
            isLastFmOnly: true // Flag to show this is Last.fm data only
          })
        }

        setLoadingProgress(20 + (i / lastfmTracks.length) * 80)
      }

      console.log('Final tracks array length:', tracksWithPreviews.length)
      
      if (tracksWithPreviews.length === 0) {
        throw new Error('No tracks found for this user.')
      }

      // Reverse to create countdown (highest ranked first)
      setTracks(tracksWithPreviews.reverse())
      setLoadingProgress(100)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
    }
  }

  // Fade in audio over specified duration
  const fadeIn = (audio, duration = 1500, targetVolume = 0.7) => {
    if (!audio) return
    
    audio.volume = 0
    const steps = 20 // Number of volume steps
    const stepDuration = duration / steps
    const volumeStep = targetVolume / steps
    let currentStep = 0
    
    fadeIntervalRef.current = setInterval(() => {
      currentStep++
      audio.volume = Math.min(volumeStep * currentStep, targetVolume)
      
      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current)
        audio.volume = targetVolume
      }
    }, stepDuration)
  }

  // Fade out audio over specified duration
  const fadeOut = (audio, duration = 1500, callback = null) => {
    if (!audio) return
    
    const startVolume = audio.volume
    const steps = 20 // Number of volume steps
    const stepDuration = duration / steps
    const volumeStep = startVolume / steps
    let currentStep = 0
    
    fadeIntervalRef.current = setInterval(() => {
      currentStep++
      audio.volume = Math.max(startVolume - (volumeStep * currentStep), 0)
      
      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current)
        audio.volume = 0
        if (callback) callback()
      }
    }, stepDuration)
  }

  // Clear any active fade effects
  const clearFadeEffects = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = null
    }
  }

  const startPlayback = async () => {
    if (tracks.length === 0) return
    
    setIsPlaying(true)
    setCurrentIndex(0)
    await playTrackWithIntro(0)
  }

  const playTrackWithIntro = async (index) => {
    if (index >= tracks.length) {
      // Countdown finished
      setIsPlaying(false)
      setCurrentIndex(-1)
      return
    }

    const track = tracks[index]
    setCurrentIndex(index)
    setPlaybackPhase('intro')

    try {
      // Play TTS intro
      const introText = `Number ${track.position}: ${track.title} by ${track.artist}`
      console.log('Playing TTS:', introText)
      
      try {
        await ttsService.generateSpeech(introText)
        console.log('TTS finished, starting audio')
      } catch (ttsError) {
        console.error('TTS failed, skipping to audio:', ttsError)
      }
      
      // Don't check isPlaying here - just continue to audio
      console.log('Proceeding to audio playback')

      // Check if track has a preview
      if (!track.preview) {
        console.log('No preview available for this track (demo mode)')
        setPlaybackPhase('demo-info')
        
        // Show demo info for 3 seconds, then continue to next
        setTimeout(() => {
          playTrackWithIntro(index + 1)
        }, 3000)
        return
      }

      // Play audio preview
      setPlaybackPhase('track')
      console.log('Set playback phase to track')
      console.log('Playing track preview:', track.preview)
      console.log('audioRef.current exists:', !!audioRef.current)
      
      if (audioRef.current) {
        console.log('Setting audio source to:', track.preview)
        
        // Clear any existing fade effects
        clearFadeEffects()
        
        audioRef.current.src = track.preview
        audioRef.current.volume = 0 // Start at 0 for fade in
        
        // Add event listeners for debugging
        audioRef.current.onloadstart = () => console.log('Audio loading started')
        audioRef.current.oncanplay = () => console.log('Audio can play')
        audioRef.current.onplay = () => {
          console.log('Audio started playing')
          // Start fade in effect
          fadeIn(audioRef.current, 1500, 0.7)
          
          // Schedule fade out 1.5 seconds before the 30-second preview ends
          fadeTimeoutRef.current = setTimeout(() => {
            if (audioRef.current && !audioRef.current.paused) {
              console.log('Starting fade out...')
              fadeOut(audioRef.current, 1500)
            }
          }, 27000) // 30 seconds - 3 seconds (1.5s fade + 1.5s buffer)
        }
        audioRef.current.onerror = (e) => console.error('Audio error:', e)
        
        console.log('About to call play()')
        try {
          await audioRef.current.play()
          console.log('Audio play() succeeded')
        } catch (playError) {
          console.error('Audio play() failed:', playError)
          // If the error is AbortError (common during development HMR), 
          // try again after a short delay
          if (playError.name === 'AbortError') {
            console.log('AbortError detected, retrying audio playback...')
            setTimeout(async () => {
              try {
                if (audioRef.current) {
                  await audioRef.current.play()
                  console.log('Audio retry succeeded')
                }
              } catch (retryError) {
                console.error('Audio retry failed:', retryError)
              }
            }, 500)
          }
        }
      } else {
        console.error('audioRef.current is null!')
      }
    } catch (err) {
      console.error('Playback error:', err)
      // Skip to next track
      setTimeout(() => playTrackWithIntro(index + 1), 1000)
    }
  }

  const handleAudioEnded = () => {
    console.log('Audio ended naturally')
    clearFadeEffects() // Clear any fade effects
    if (isPlaying && currentIndex < tracks.length - 1) {
      console.log(`Moving from track ${currentIndex + 1} to track ${currentIndex + 2}`)
      setTimeout(() => playTrackWithIntro(currentIndex + 1), 500)
    } else {
      console.log('Countdown finished')
      setIsPlaying(false)
      setCurrentIndex(-1)
    }
  }

  const stopPlayback = () => {
    clearFadeEffects() // Clear any fade effects
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentIndex(-1)
    setPlaybackPhase('intro')
    speechSynthesis.cancel()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.volume = 0.7 // Reset volume for next playback
    }
  }

  const togglePause = () => {
    if (playbackPhase === 'track' && audioRef.current) {
      if (isPaused) {
        audioRef.current.play()
        setIsPaused(false)
        // Resume fade effects if they were active
        if (audioRef.current.volume === 0) {
          fadeIn(audioRef.current, 500, 0.7) // Quick fade in on resume
        }
      } else {
        clearFadeEffects() // Clear fade effects when pausing
        audioRef.current.pause()
        setIsPaused(true)
      }
    } else if (playbackPhase === 'intro') {
      if (isPaused) {
        speechSynthesis.resume()
        setIsPaused(false)
      } else {
        speechSynthesis.pause()
        setIsPaused(true)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Preparing Your Countdown
          </h2>
          <div className="w-full bg-dark-700 rounded-full h-2 mb-4">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-dark-300">
            Fetching your top tracks and finding previews...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Oops! Something went wrong
          </h2>
          <p className="text-dark-300 mb-6">{error}</p>
          <Link to="/" className="btn-primary">
            Try Again
          </Link>
        </div>
      </div>
    )
  }

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Demo Mode Banner */}
        {tracks.length > 0 && tracks[0]?.isDemoMode && (
          <div className="bg-blue-900/50 border border-blue-700 p-4 rounded-lg mb-8">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎵</div>
              <div>
                <h3 className="font-semibold text-blue-200 mb-1">Demo Mode Active</h3>
                <p className="text-sm text-blue-300 mb-2">
                  You're seeing sample data with classic rock tracks. In production with your Last.fm API key:
                </p>
                <ul className="text-xs text-blue-400 space-y-1">
                  <li>• Real user data from Last.fm</li>
                  <li>• 30-second Deezer track previews</li>
                  <li>• Actual album artwork</li>
                  <li>• User's personalized listening stats</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {username}'s Top {limit} Tracks Countdown
          </h1>
          <p className="text-dark-300">
            {tracks.length} tracks found • {period.replace(/(\d+)/, '$1 ')}
          </p>
        </div>

        {/* View Mode Toggle */}
        {currentTrack && (
          <div className="flex justify-center mb-6">
            <div className="bg-dark-800 rounded-lg p-1 flex">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-300 hover:text-white'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('nowplaying')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'nowplaying'
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-300 hover:text-white'
                }`}
              >
                Now Playing
              </button>
            </div>
          </div>
        )}

        {/* Current Track Display */}
        {currentTrack && viewMode === 'list' && (
          <div className="rounded-xl p-6 mb-8 max-w-2xl mx-auto" style={{backgroundColor: '#101010'}}>
            <div className="flex items-center space-x-4">
              <img 
                src={currentTrack.cover} 
                alt={`${currentTrack.title} cover`}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="text-primary-400 text-sm font-medium mb-1">
                  Now Playing #{currentTrack.position}
                  {playbackPhase === 'intro' && ' - Introduction'}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {currentTrack.title}
                </h3>
                <p className="text-dark-300">{currentTrack.artist}</p>
                {currentTrack.album && (
                  <p className="text-dark-400 text-sm">{currentTrack.album}</p>
                )}
              </div>
              {currentTrack.deezerLink ? (
                <a 
                  href={currentTrack.deezerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm"
                >
                  Listen on Deezer
                </a>
              ) : (
                <div className="text-xs text-dark-400 text-center">
                  <div>No Deezer link</div>
                  <div>(CORS limited)</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Now Playing Full View */}
        {currentTrack && viewMode === 'nowplaying' && (
          <div className="max-w-2xl mx-auto mb-8 text-center">
            <div className="rounded-xl p-8" style={{backgroundColor: '#101010'}}>
              <img 
                src={currentTrack.cover} 
                alt={`${currentTrack.title} cover`}
                className="w-80 h-80 mx-auto rounded-2xl object-cover mb-6 shadow-2xl"
              />
              <div className="space-y-2">
                <div className="text-primary-400 text-sm font-medium">
                  #{currentTrack.position} 
                  {playbackPhase === 'intro' && ' • Introduction'}
                  {playbackPhase === 'track' && ' • Playing'}
                  {playbackPhase === 'demo-info' && ' • Demo Mode'}
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {currentTrack.title}
                </h2>
                <p className="text-xl text-dark-300">{currentTrack.artist}</p>
                {currentTrack.album && (
                  <p className="text-dark-400">{currentTrack.album}</p>
                )}
                <div className="text-sm text-dark-400" style={{marginTop: '24px'}}>
                  {currentTrack.playcount} plays
                </div>
                {currentTrack.deezerLink && (
                  <div style={{marginTop: '48px'}}>
                    <a 
                      href={currentTrack.deezerLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                    >
                      Listen on Deezer
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          {!isPlaying ? (
            <button onClick={startPlayback} className="btn-primary flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Start Countdown
            </button>
          ) : (
            <>
              <button onClick={togglePause} className="btn-secondary">
                {isPaused ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                )}
              </button>
              <button onClick={stopPlayback} className="btn-secondary">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Playback Status */}
        {currentIndex !== -1 && (
          <div className="text-center mb-8">
            {playbackPhase === 'intro' && (
              <div className="bg-wine-800/50 p-4 rounded-lg">
                <div className="animate-pulse">
                  <div className="w-4 h-4 bg-wine-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-wine-200">Speaking introduction...</p>
                </div>
              </div>
            )}
            {playbackPhase === 'track' && (
              <div className="bg-green-800/50 p-4 rounded-lg">
                <div className="animate-pulse">
                  <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-green-200">Playing track preview...</p>
                </div>
              </div>
            )}
            {playbackPhase === 'demo-info' && (
              <div className="bg-blue-800/50 p-4 rounded-lg">
                <div className="text-blue-200">
                  <div className="text-2xl mb-2">🎵</div>
                  <p className="font-semibold mb-1">Demo Mode</p>
                  <p className="text-sm">This would play a 30-second Deezer preview in production</p>
                  <p className="text-xs mt-2 opacity-75">Browser CORS restrictions prevent preview playback in demo</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Track List */}
        {viewMode === 'list' && (
          <div className="grid gap-4">
            {tracks.map((track, index) => (
              <div 
                key={index}
                className={`rounded-lg p-4 flex items-center space-x-4 transition-all duration-200 ${
                  currentIndex === index ? 'ring-2 ring-primary-500' : ''
                }`}
                style={{backgroundColor: '#101010'}}
              >
                <div className="text-primary-400 font-bold text-lg w-8 text-center">
                  #{track.position}
                </div>
                <img 
                  src={track.cover} 
                  alt={`${track.title} cover`}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{track.title}</h4>
                  <p className="text-dark-300 text-sm">{track.artist}</p>
                </div>
                <div className="text-dark-400 text-sm">
                  {track.playcount} plays
                </div>
              </div>
            ))}
          </div>
        )}

        <audio 
          ref={audioRef}
          key="main-audio-player"
          onEnded={handleAudioEnded}
          onError={(e) => console.error('Audio error:', e)}
        />
      </div>
    </div>
  )
}

export default Countdown 