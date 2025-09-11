# Railway Container Manager 🚀

A comprehensive web application for managing Railway deployments with an interactive mini-game. Built for a job interview demonstration, showcasing modern React/Next.js development, GraphQL API integration, and creative UI/UX design.

## Features

- ✅ **Clean UI with status indicators** - Real-time deployment status with visual feedback
- 🎮 **Interactive Mini-Game** - "Byte Wrangler" game with 20 bytes to collect in 15 seconds
- 🔄 **Deployment Management** - Start, stop, and restart Railway deployments
- 🔒 **Secure API token handling** - Environment-based configuration
- ⚡ **Real-time status updates** - Live deployment status monitoring
- 🎨 **Modern UI Design** - Glass-morphism effects and smooth animations
- 👻 **Dynamic Difficulty** - Ghosts speed up after collecting 10 bytes
- 🎯 **Progressive Gameplay** - Bytes respawn every second for continuous challenge

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

## Code Architecture

### Key Technical Demonstrations

#### 1. **Modern React Patterns**
- **Hooks**: useState, useEffect, useRef for state and lifecycle management
- **Refs**: Canvas manipulation and animation control
- **Custom Logic**: Game state management and deployment orchestration

#### 2. **Railway GraphQL Integration**
- **API Endpoints**: RESTful wrappers around Railway's GraphQL API
- **Error Handling**: Comprehensive error catching and user feedback
- **Authentication**: Secure token-based authentication
- **Fallback Logic**: Multiple deployment strategies for reliability

#### 3. **HTML5 Canvas Game Development**
- **Game Loop**: requestAnimationFrame for smooth 60fps animations
- **Collision Detection**: Distance-based collision for bytes and ghosts
- **Mouse Interaction**: Real-time mouse tracking and drag mechanics
- **Dynamic Difficulty**: Progressive challenge scaling

#### 4. **UI/UX Design**
- **Glass-morphism**: Modern translucent design elements
- **Responsive Layout**: Adaptive design for different screen sizes
- **Smooth Animations**: CSS keyframes and JavaScript animations
- **Visual Feedback**: Real-time status indicators and progress tracking

## Usage

- **Deployment Management**: Click "Redeploy Service" to trigger new deployments
- **Status Checking**: Click "Check Status" to view current deployment state
- **Mini-Game**: Enable "Bored-Mode" for interactive deployment experience
- **Configuration**: Toggle configuration panel to view settings

## Project Structure

### Core Files
- **`pages/index.tsx`** - Main React component with UI, game logic, and state management
- **`pages/_app.tsx`** - Next.js app wrapper with global styles
- **`styles/globals.css`** - Global CSS with animations and base styling

### API Endpoints
- **`pages/api/start-deployment.ts`** - Handles service redeployment using Railway GraphQL API
- **`pages/api/stop-deployment.ts`** - Retrieves current deployment status and information
- **`pages/api/restart-deployment.ts`** - Implements service restart with fallback mechanisms
- **`pages/api/test-connection.ts`** - Tests Railway API connectivity and authentication

### Configuration
- **`package.json`** - Project dependencies and scripts
- **`tsconfig.json`** - TypeScript configuration
- **`next.config.js`** - Next.js build configuration
- **`railway.json`** - Railway deployment configuration
- **`env.example`** - Environment variables template

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + React 18
- **Styling**: CSS-in-JS with glass-morphism effects
- **API**: Railway GraphQL API v2
- **Deployment**: Railway platform
- **Game Engine**: HTML5 Canvas with requestAnimationFrame

## Troubleshooting

- **"API token not configured"**: Set `RAILWAY_API_TOKEN` in environment
- **"Service not found"**: Verify your `NEXT_PUBLIC_RAILWAY_SERVICE_ID`
- **GraphQL errors**: Check Railway API documentation for latest schema




