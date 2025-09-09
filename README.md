# Railway Container Manager 🚀

A simple web app to start and stop Railway containers using their GraphQL API.

## Features

- ✅ Clean UI with status indicators
- 🎮 Start/Stop container buttons
- 🔒 Secure API token handling
- ⚡ Real-time status updates
- 🎨 Beautiful TailwindCSS styling

## Quick Start

1. **Clone and install:**
   ```bash
   git clone <your-repo>
   cd railway-container-manager
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your Railway credentials:
   ```
   RAILWAY_API_TOKEN=your_railway_api_token_here
   NEXT_PUBLIC_RAILWAY_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_RAILWAY_SERVICE_ID=your_service_id_here
   ```

3. **Get your Railway credentials:**
   - API Token: Railway Dashboard → Account → Tokens
   - Project ID: Your project URL or GraphQL queries
   - Service ID: Your service URL or GraphQL queries

4. **Run locally:**
   ```bash
   npm run dev
   ```

## Deploy to Railway

1. **Connect your GitHub repo to Railway**
2. **Set environment variables in Railway dashboard:**
   - `RAILWAY_API_TOKEN`
   - `NEXT_PUBLIC_RAILWAY_PROJECT_ID` 
   - `NEXT_PUBLIC_RAILWAY_SERVICE_ID`
3. **Deploy!** Railway will auto-deploy on git push

## Usage

- Visit your app URL
- Click "Start Container" to deploy
- Click "Stop Container" to stop the deployment
- Status updates automatically

## Tech Stack

- Next.js 14 + TypeScript
- Apollo Client for GraphQL
- TailwindCSS for styling
- Railway GraphQL API

## Troubleshooting

- **"API token not configured"**: Set `RAILWAY_API_TOKEN` in environment
- **"Service not found"**: Verify your `NEXT_PUBLIC_RAILWAY_SERVICE_ID`
- **GraphQL errors**: Check Railway API documentation for latest schema

## License

MIT


