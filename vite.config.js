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
    port: 5173,
    strictPort: false,
    hmr: {
      clientPort: 443,
    },
    allowedHosts: [
      'localhost',
      '.replit.dev',
      '.repl.co',
      '.sisko.replit.dev',
    ],
    // ── Futu proxy: forward /api/* → localhost:3001 in dev ──────────────────
    // When FutuOpenD + the proxy server are running, this makes /api/klines/...
    // calls work seamlessly from the React dev server without CORS issues.
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
