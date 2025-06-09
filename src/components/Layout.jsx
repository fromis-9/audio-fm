import { Link, useLocation } from 'react-router-dom'

function Layout({ children }) {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
  ]

  return (
    <div className="min-h-screen bg-dark-900">
      <nav className="border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8">
                <img 
                  src="/img/afm.png" 
                  alt="audio.fm logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-xl font-semibold text-white">audio.fm</span>
            </Link>
            
            <div className="flex items-center space-x-6">
              <a
                href="https://github.com/fromis-9/audio-fm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-300 hover:text-white transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'text-white bg-dark-800'
                      : 'text-dark-300 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t border-dark-700 mt-16">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-dark-400 text-sm">
            <p>Uses Last.fm API for track data and Deezer API for audio previews</p>
            <p>Not affiliated with Last.fm or Deezer</p>
            <p>© 2025 <a href="https://github.com/fromis-9" target="_blank" rel="noopener noreferrer" className="github-link">corinthians</a> <span className="separator">• </span>
                <a href="https://github.com/fromis-9/audio-fm" target="_blank" rel="noopener noreferrer" className="github-link">GitHub</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout 