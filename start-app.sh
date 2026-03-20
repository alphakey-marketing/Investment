#!/bin/bash

# Check if dist folder exists (built app) - if yes, run production mode
if [ -d "/home/runner/workspace/dist" ]; then
  echo "Starting production server (built app found)..."
  cd /home/runner/workspace/server
  NODE_ENV=production npm run start
else
  # Development mode: Start backend + Vite dev server
  echo "Starting development servers..."
  echo "Starting Yahoo proxy server on port 3001..."
  cd /home/runner/workspace/server && npm run dev &
  sleep 4
  
  echo "Starting Vite dev server on port 5000..."
  cd /home/runner/workspace && npm run dev
fi
