import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/broadcasting': {
        target: 'https://backend.ninety90degree.com',
        changeOrigin: true,
        secure: false,
      },
      '/broadcasting': {
        target: 'https://backend.ninety90degree.com',
        changeOrigin: true,
        secure: false,
      },
      '/public/api/broadcasting': {
        target: 'https://backend.ninety90degree.com',
        changeOrigin: true,
        secure: false,
      },
      '/public/broadcasting': {
        target: 'https://backend.ninety90degree.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
