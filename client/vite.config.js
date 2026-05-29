import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Base path: '/' for root-hosted platforms (Render, Vercel, Netlify),
  // or '/cll/' for GitHub Pages. Controlled via VITE_BASE_PATH.
  const base = env.VITE_BASE_PATH || '/'
  return {
  plugins: [react()],
  base,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
  }
})