import { defineConfig } from 'vite'

export default defineConfig({
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
  },
  
  // Plugin configuration
  plugins: [
    // Add plugins here as needed
    // Example: viteImagemin(), viteSvgIcons(), etc.
  ],
})
