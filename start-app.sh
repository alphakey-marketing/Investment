#!/bin/bash

# Production mode: Run the built app
if [ "$NODE_ENV" = "production" ]; then
  echo "Starting production server..."
  cd /home/runner/workspace/server
  npm run start
else
  # Development mode: Start backend + Vite dev server
  echo "Starting Yahoo proxy server..."
  cd /home/runner/workspace/server && npm run dev &
  sleep 4
  
  echo "Starting Vite dev server..."
  cd /home/runner/workspace && npm run dev
fi
