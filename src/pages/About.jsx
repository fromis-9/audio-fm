function About() {
  const rules = [
    {
      type: 'restriction',
      icon: '❌',
      title: 'No export/download',
      description: 'Audio must be streamed only, not saved or bundled'
    },
    {
      type: 'restriction', 
      icon: '❌',
      title: 'No remixing or mixing',
      description: 'Voice and music must play sequentially, not overlaid'
    },
    {
      type: 'requirement',
      icon: '✅',
      title: 'Show metadata',
      description: 'Always show track title, artist, and album cover during playback'
    },
    {
      type: 'requirement',
      icon: '✅', 
      title: 'Attribution',
      description: 'Show Deezer logo + link on every track preview'
    }
  ]

  const features = [
    'Enter your Last.fm username',
    'Select time range (7 days to all time)',
    'Voiceovers introduce each track',
    'Stream 30-second previews from Deezer',
    'Countdown format',
    'Direct links to listen on Deezer'
  ]

  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            About audio.fm
          </h1>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto">
            Create narrated countdowns of your top songs using Last.fm data
          </p>
        </div>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How it works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>
                <span className="text-dark-200">{feature}</span>
              </div>
            ))}
          </div>
        </section>



        {/* Legal Notice */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Legal Notice</h2>
          <div className="rounded-lg p-6 space-y-4 text-dark-300" style={{backgroundColor: '#101010'}}>
            <p>
              <strong className="text-white">Audio Previews:</strong> All music previews are provided by Deezer 
              and are limited to 30-second clips. No audio is downloaded or stored locally.
            </p>
            <p>
              <strong className="text-white">Attribution:</strong> Track metadata is sourced from Last.fm. 
              Album artwork and preview links are provided by Deezer.
            </p>
            <p>
              <strong className="text-white">Usage:</strong> This application is for personal, non-commercial use only. 
              To listen to full tracks, please use the provided Deezer links or your preferred streaming service.
            </p>
            <p>
              <strong className="text-white">Privacy:</strong> No user data is stored or tracked. All processing 
              happens locally in your browser.
            </p>
          </div>
        </section>

        {/* Coming Soon */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Coming Soon</h2>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 border border-primary-700/30 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-primary-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                </svg>
                <h3 className="text-lg font-semibold text-white">Extended Time Periods</h3>
              </div>
              <p className="text-dark-300 mb-4">
                Enhanced time period selection with Monthly and Yearly options. Monthly mode lets you 
                select specific years and months, while Yearly mode provides year-based statistics.
              </p>
              <p className="text-primary-400 text-sm">
                More granular control over your music data timeframes
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 border border-primary-700/30 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-primary-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15.5v-9l6 4.5-6 4.5z"/>
                </svg>
                <h3 className="text-lg font-semibold text-white">Spotify Integration</h3>
              </div>
              <p className="text-dark-300 mb-4">
                Connect your Spotify account to create countdowns from your actual listening data.
              </p>
              <p className="text-primary-400 text-sm">
                Will require OAuth authentication for enhanced privacy and personalization
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default About 