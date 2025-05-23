import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as process from 'process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env
  },
  server: {
    // Ensure SPA fallback for development server
    // This makes sure direct access to routes like /messenger-order works
    historyApiFallback: true,
    // Optional: Define the port if needed, default is 5173
    // port: 5173,
    allowedHosts: true,
  }
})
