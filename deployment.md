# Cloudflare Deployment Guide

## Prerequisites

1. **Cloudflare account** with your domain added to Cloudflare
2. **Wrangler CLI** installed: `npm install -g wrangler`
3. **Last.fm API key** from https://www.last.fm/api

## Step 1: Deploy the Worker (Backend)

### 1.1 Login to Cloudflare
```bash
wrangler login
```

### 1.2 Create KV Namespaces
```bash
# For rate limiting
wrangler kv:namespace create "RATE_LIMIT_KV"
wrangler kv:namespace create "RATE_LIMIT_KV" --preview

# For caching  
wrangler kv:namespace create "CACHE_KV"
wrangler kv:namespace create "CACHE_KV" --preview
```

### 1.3 Update wrangler.toml
Replace the KV namespace IDs in `wrangler.toml` with the ones from step 1.2:
```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "abc123..." # Replace with your ID
preview_id = "def456..." # Replace with your preview ID

[[kv_namespaces]]
binding = "CACHE_KV"  
id = "ghi789..." # Replace with your ID
preview_id = "jkl012..." # Replace with your preview ID
```

### 1.4 Set Environment Variables
```bash
# Set your Last.fm API key
wrangler secret put VITE_LASTFM_API_KEY
# Enter your API key when prompted
```

### 1.5 Deploy the Worker
```bash
wrangler deploy
```

Your API will be available at: `https://audiofm-api.your-subdomain.workers.dev`

## Step 2: Deploy Frontend to Pages

### 2.1 Build the React App
```bash
npm run build
```

### 2.2 Set API URL Environment Variable
Set your Worker URL as an environment variable (don't hardcode it!):

#### For local development:
Add to your `.env` file:
```bash
VITE_API_URL=https://audiofm-api.your-subdomain.workers.dev
```

#### For production deployment:
Set the environment variable in your deployment platform (Vercel, Netlify, etc.)

### 2.3 Deploy to Cloudflare Pages

#### Option A: Via Cloudflare Dashboard
1. Go to Cloudflare Dashboard → Pages
2. Connect your GitHub repository
3. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Environment variables**: `VITE_LASTFM_API_KEY=your-key`

#### Option B: Via Wrangler CLI
```bash
npx wrangler pages deploy dist --project-name audiofm
```

## Step 3: Configure Custom Domain

### 3.1 Set up your domain
1. In Cloudflare Dashboard → Pages → your-project
2. Go to "Custom domains"
3. Add `yourdomain.com` and `www.yourdomain.com`

### 3.2 Configure Worker Routes
1. Go to Cloudflare Dashboard → Workers & Pages → audiofm-api
2. Go to "Triggers" → "Routes"
3. Add route: `yourdomain.com/api/*`

This makes your API available at `yourdomain.com/api/*` instead of the workers.dev subdomain.

## Step 4: Test the Deployment

### 4.1 Test API Endpoints
```bash
# Health check
curl https://yourdomain.com/api/health

# Test Last.fm (replace 'username' with real Last.fm user)
curl "https://yourdomain.com/api/lastfm/top-tracks?username=rj&period=1month&limit=10"
```

### 4.2 Test Frontend
Visit `https://yourdomain.com` and try creating a countdown.

## Troubleshooting

### Worker Issues
- Check logs: `wrangler tail`
- Verify KV namespaces are created and bound correctly
- Ensure environment variables are set: `wrangler secret list`

### Pages Issues
- Check build logs in Cloudflare Dashboard
- Verify environment variables are set in Pages settings
- Make sure API URLs point to the correct Worker

### Domain Issues
- Verify DNS is pointing to Cloudflare
- Check SSL/TLS settings (should be "Full" or "Full (strict)")
- Wait for DNS propagation (can take up to 24 hours)

## Production Checklist

- [ ] Worker deployed with correct KV namespaces
- [ ] Environment variables set (VITE_LASTFM_API_KEY)
- [ ] Frontend built with correct API URLs
- [ ] Pages deployed with custom domain
- [ ] Worker routes configured for /api/*
- [ ] SSL certificate active
- [ ] All endpoints tested

## Architecture Overview

```
Users → yourdomain.com (Cloudflare Pages)
      ↓
      yourdomain.com/api/* (Cloudflare Workers)
      ↓
      Last.fm API + Deezer API
```

The frontend handles the UI, while the Worker provides:
- API proxy for Last.fm and Deezer
- Rate limiting (60 req/burst, 15/sec refill)
- Caching (5-minute TTL)
- CORS handling
- Error handling and logging 