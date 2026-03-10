import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443, // Replit uses HTTPS port 443 externally
    },
    allowedHosts: [
      'localhost',
      '.replit.dev',      // wildcard for all *.replit.dev subdomains
      '.repl.co',         // older Replit domains
      '.sisko.replit.dev' // specific Replit cluster
    ],
  }
})
