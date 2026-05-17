import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Keep the public folder enabled so static JSON files can be served by Vite.
  publicDir: 'public',
  server: {
    fs: { allow: ['..'] }
  }
})