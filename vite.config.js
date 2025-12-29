import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  // Ensure built assets load correctly when served from subpaths or file://
  base: './',
  // Server configuration
  server: {
    port: 3000,
    open: true, // Auto-open browser
    hmr: true,  // Hot module replacement
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        tenet1: resolve(__dirname, 'tenet-1.html'),
        tenet2: resolve(__dirname, 'tenet-2.html'),
        tenet3: resolve(__dirname, 'tenet-3.html'),
      },
    },
  },
  
  // Plugin configuration
  plugins: [
    // Add plugins here as needed
    // Example: viteImagemin(), viteSvgIcons(), etc.
  ],
})
