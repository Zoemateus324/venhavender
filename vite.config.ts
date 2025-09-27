import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    // Adiciona suporte ao styled-components
    babel: {
      plugins: [
        ['babel-plugin-styled-components', {
          displayName: true,
          fileName: false
        }]
      ]
    }
  })],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    historyApiFallback: true
  }
});
