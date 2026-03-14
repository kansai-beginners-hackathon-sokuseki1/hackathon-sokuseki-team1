import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/hackathon-sokuseki-team1/',
  server: {
    proxy: {
      // /api/* → Cloudflare Workers dev server (wrangler dev)
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  }
})
