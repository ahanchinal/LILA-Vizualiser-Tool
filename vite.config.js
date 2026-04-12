import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'deck': ['@deck.gl/core', '@deck.gl/layers', '@deck.gl/react', '@deck.gl/geo-layers', '@deck.gl/extensions'],
          'react-vendor': ['react', 'react-dom'],
        }
      }
    }
  }
})
