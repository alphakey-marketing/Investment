import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      port: 5000,
    },
    allowedHosts: [
      'localhost',
      '.replit.dev',
      '.repl.co',
      '.sisko.replit.dev',
    ],
    // ── API proxy in dev: forward /api/* → localhost:3001 ──────────────────
    // In development, the backend server runs on port 3001,
    // so we need to proxy API requests from the Vite dev server (port 5000).
    // In production, the server serves both API and static files on the same port.
    proxy: {
      '/api': {
        target:       'http://localhost:3001',
        changeOrigin: true,
        // If the proxy is down, Vite will return a 503 and the hook's
        // try/catch will automatically fall back to Yahoo Finance.
      },
    },
  },
});
