#!/bin/bash

# Start server in background
echo "Starting Yahoo proxy server..."
cd /home/runner/workspace/server && npm run dev &
sleep 4

# Start frontend
echo "Starting Vite dev server..."
cd /home/runner/workspace && npm run dev
