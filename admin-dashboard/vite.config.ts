import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    allowedHosts: ['a819-105-119-38-103.ngrok-free.app']
  },
})
