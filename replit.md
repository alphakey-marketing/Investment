# K均交易法 Investment Signal App

## Project Overview
This is a **K均交易法 (K-MA Trading)** strategy app for analyzing Hong Kong Gold ETF (3081.HK) using Moving Average crossovers and real-time signal generation.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express (Yahoo Finance proxy)
- **Charting**: TradingView's lightweight-charts
- **State**: Zustand
- **Notifications**: React Hot Toast + Telegram/Email alerts

## Development

### Running Locally
```bash
npm install && npm install --prefix server
npm run dev
```

This starts:
- **Backend API** on port 3001 (Yahoo Finance proxy)
- **Frontend Dev Server** on port 5000 (Vite with HMR)

### Building for Production
```bash
npm run build
```

This creates a `dist/` folder with the built React app.

## Production Deployment

When published on Replit, the app:
1. Runs the build step: `npm run build` (creates static files in `dist/`)
2. Starts via `./start-app.sh` with `NODE_ENV=production`
3. The Express server on port 5000 serves:
   - Static React app files
   - `/api/*` endpoints (Yahoo Finance proxy)

### Key Features
- **Live Mode**: Real-time signal detection for HK Gold ETF
- **Paper Trading**: Risk-free simulation mode
- **Backtest**: Historical performance analysis
- **Signal Alerts**: Telegram & Email notifications
- **Position Calculator**: Risk/reward calculations
- **Trade Journal**: Track all trades and performance

### Architecture
- Single Express server serves both static files and API in production
- In development, separate Vite dev server proxies API requests to backend on port 3001
- Built React app is served from `./dist/` folder in production
- Server automatically detects production mode via `NODE_ENV` environment variable

## Troubleshooting

### Published App Shows "Server Not Running"
The published app requires:
1. `npm run build` to create the `dist/` folder (automatic on deploy)
2. `NODE_ENV=production` to be set (automatic on Replit)
3. Port 5000 to be available (configured automatically)

If the issue persists, check that:
- The Express server in `server/index.js` is serving static files from `dist/`
- The build output includes `dist/index.html`
- The workflow is configured to use port 5000 for webview mode
