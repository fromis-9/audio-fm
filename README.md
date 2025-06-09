<div align="center">
  <img src="public/img/afm.png" alt="audio.fm logo" width="120" height="120">
  
  # audio.fm
  
  Create narrated countdowns of your top Last.fm tracks with live audio previews.
</div>

## Features

- **Discover Your Music Journey** - Transform your Last.fm listening history into an engaging countdown experience
- **Personalized Countdowns** - Generate rankings from your actual listening data across different time periods
- **Immersive Audio Experience** - Listen to track previews with fade transitions between songs
- **Voice-Guided Discovery** - Automated narration introduces each track as it plays
- **Flexible Time Ranges** - Explore your top tracks from the past week to all-time favorites
- **Visual Music Experience** - Switch between compact list view and full-screen album art display
- **Instant Access** - Click through to listen to full tracks on Deezer
- **Works Everywhere** - Fully responsive design for desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Vercel API Routes (serverless)
- **Audio**: HTML5 Audio + Web Speech API
- **APIs**: Last.fm + Deezer (with rate limiting & caching)
- **Features**: Token bucket rate limiting, 5-min caching, CORS handling

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Free Last.fm API key

### Setup

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd audio-fm
   npm install
   ```

2. **Get Last.fm API key:**
   - Visit [Last.fm API](https://www.last.fm/api)
   - Create account → Request API key
   - Copy your key

3. **Configure environment:**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env with your values
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```

5. **Open browser:** `http://localhost:3000`

## Usage

1. **Enter Username** - Any public Last.fm user
2. **Select Time Range** - 7 days, 1 month, 3 months, 6 months, 12 months, or all time
3. **Choose Track Count** - Up to 50 tracks
4. **Start Countdown** - Enjoy your personalized music journey!

## Architecture

### API Routes (`/api`)
- **Serverless Functions** - Vercel Edge Runtime
- **Rate Limiting** - Token bucket (60 requests burst, 15/sec refill)
- **Caching** - 5-minute in-memory cache
- **CORS** - Configured for production
- **User-Agent** - Compliant with Last.fm requirements

### Frontend App (`/src`)
- **React Router** - Multi-page navigation
- **API Services** - Modular Last.fm + Deezer integration
- **Audio Engine** - Custom fade effects and playback management
- **Responsive UI** - Mobile-first Tailwind design

## Legal & Compliance

**What We Do:**
- Stream 30-second previews only
- Full attribution to Last.fm and Deezer
- Sequential playback (voice → music)
- Direct links to official platforms
- No downloads or file storage

**What We Don't Do:**
- Download or save audio files
- Mix voice with music simultaneously
- Commercial redistribution
- Cache preview URLs (Deezer ToS)

## Deployment

The app is deployed on Vercel with automatic deployments from the main branch.

### Environment Variables
Required environment variable in your Vercel project:
```bash
VITE_LASTFM_API_KEY=your_lastfm_api_key
```

### Deploy Your Own
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffromis-9%2Faudio-fm)

1. Click the "Deploy with Vercel" button
2. Set up required environment variables
3. Deploy!

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Submit pull request with clear description

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Track Data**: [Last.fm API](https://www.last.fm/api)
- **Audio Previews**: [Deezer API](https://developers.deezer.com)
- **Icons**: Heroicons

---

**Independent project** • Not affiliated with Last.fm or Deezer • Built for music lovers 