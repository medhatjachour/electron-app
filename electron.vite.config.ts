import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    root: resolve('src/renderer'),
    build: {
      rollupOptions: {
        input: resolve('src/renderer/index.html')
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@pages': resolve('src/renderer/src/pages'),
        '@components': resolve('src/renderer/src/components'),
        '@': resolve('src'),
        // Shims for Next imports used in the UI
        'next/router': resolve('src/renderer/next/router.tsx'),
        'next/link': resolve('src/renderer/next/link.tsx')
      }
    },
    plugins: [react()],
    server: {
      hmr: true
    }
  }
})
