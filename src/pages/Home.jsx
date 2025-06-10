import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DateRangeSelector from '../components/DateRangeSelector'

function Home() {
  const [username, setUsername] = useState('')
  const [timeRange, setTimeRange] = useState('1month')
  const [trackCount, setTrackCount] = useState('20')
  const [isLoading, setIsLoading] = useState(false)
  const [useCustomRange, setUseCustomRange] = useState(false)
  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)
  const navigate = useNavigate()

  const timeRanges = [
    { value: '7day', label: 'Last 7 days' },
    { value: '1month', label: 'Last month' },
    { value: '3month', label: 'Last 3 months' },
    { value: '6month', label: 'Last 6 months' },
    { value: '12month', label: 'Last year' },
    { value: 'overall', label: 'All time' },
    { value: 'custom', label: 'Custom date range' },
  ]

  const trackCounts = [
    { value: '5', label: 'Top 5' },
    { value: '10', label: 'Top 10' },
    { value: '20', label: 'Top 20' },
    { value: '50', label: 'Top 50' },
    { value: '100', label: 'Top 100' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim()) return

    // Validate custom date range if selected
    if (useCustomRange && (!fromDate || !toDate)) {
      alert('Please select both from and to dates for custom range')
      return
    }

    if (useCustomRange && fromDate >= toDate) {
      alert('From date must be before to date')
      return
    }

    setIsLoading(true)
    
    // Navigate to countdown page with parameters
    if (useCustomRange) {
      const fromTimestamp = Math.floor(fromDate.getTime() / 1000)
      const toTimestamp = Math.floor(toDate.getTime() / 1000)
      navigate(`/countdown?user=${encodeURIComponent(username.trim())}&from=${fromTimestamp}&to=${toTimestamp}&limit=${trackCount}`)
    } else {
      navigate(`/countdown?user=${encodeURIComponent(username.trim())}&period=${timeRange}&limit=${trackCount}`)
    }
  }

  const handleTimeRangeChange = (e) => {
    const value = e.target.value
    setTimeRange(value)
    setUseCustomRange(value === 'custom')
    
    if (value !== 'custom') {
      setFromDate(null)
      setToDate(null)
    }
  }

  return (
    <div className="flex justify-center px-4 pt-16 pb-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">

          <h1 className="text-4xl font-bold mb-2 audiofm-title">
            audio.fm
          </h1>
          <p className="text-sm text-dark-300 max-w-sm mx-auto">
            Create narrated countdowns of your top tracks from Last.fm
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-dark-200 mb-2">
              Last.fm Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your Last.fm username"
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="timeRange" className="block text-sm font-medium text-dark-200 mb-2">
              Time Range
            </label>
            <select
              id="timeRange"
              value={timeRange}
              onChange={handleTimeRangeChange}
              className="input-field w-full"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {useCustomRange && (
            <div>
              <DateRangeSelector
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label htmlFor="trackCount" className="block text-sm font-medium text-dark-200 mb-2">
              Number of Tracks
            </label>
            <select
              id="trackCount"
              value={trackCount}
              onChange={(e) => setTrackCount(e.target.value)}
              className="input-field w-full"
            >
              {trackCounts.map((count) => (
                <option key={count.value} value={count.value}>
                  {count.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username.trim() || (useCustomRange && (!fromDate || !toDate))}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating your countdown...
              </span>
            ) : (
              'Create Countdown'
            )}
          </button>
        </form>

        <div className="text-center text-sm text-dark-400">
          <p>
            Don't have a Last.fm account?{' '}
            <a 
              href="https://www.last.fm/join" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 transition-colors"
            >
              Sign up here
            </a>
          </p>
        </div>

        <section className="cta-section">
          <div className="cta-container">
            <h2 className="text-2xl font-bold">
              Try out <span className="videofm-title">video.fm</span>
            </h2>
            <p className="cta-description">
            Transform your Last.fm history into video compilations
            </p>
            <a
              href="https://videofm.app"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-button"
            >
              Visit video.fm
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home 