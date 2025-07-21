import { defineConfig, loadEnv } from 'vite' // Import loadEnv
import react from '@vitejs/plugin-react'
import * as process from 'process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => { // Destructure mode from the config function argument
  const env = loadEnv(mode, process.cwd(), 'VITE_'); // Load environment variables with VITE_ prefix

  console.log('VITE_BACKEND_URL used in Vite proxy:', env.VITE_BACKEND_URL); // Add this log

  return {
    plugins: [react()],
    define: {
      'process.env': process.env // Keep this for other process.env usages if any
    },
    server: {
      historyApiFallback: true,
      host: true,
      allowedHosts: true,
      proxy: {
        '/uploads': {
          target: env.VITE_BACKEND_URL, // Use env.VITE_BACKEND_URL here
          changeOrigin: true,
          secure: false,
        },
      },
    }
  };
});
