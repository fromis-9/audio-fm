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
            
            <div className="flex space-x-6">
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