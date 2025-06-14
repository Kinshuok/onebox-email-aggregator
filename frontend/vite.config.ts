import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth-url': 'http://localhost:3000',
      '/oauth2callback': 'http://localhost:3000',
      '/search': 'http://localhost:3000',
    },
  },
});
