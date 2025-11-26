import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  // Prioritize the API_KEY from the system environment (Vercel) over local .env files
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Safely replace process.env.API_KEY with the actual value
      'process.env.API_KEY': JSON.stringify(apiKey),
      // Polyfill process.env to prevent "process is not defined" crashes in 3rd party libs
      'process.env': {}
    },
    build: {
      outDir: 'dist',
    }
  };
});