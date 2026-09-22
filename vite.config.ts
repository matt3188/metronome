/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command }) => {
  // Changing the service-worker URL on every production deployment guarantees
  // that browsers check and install the worker even when sw.js itself is unchanged.
  const buildId = process.env.GITHUB_SHA
    ?? process.env.VITE_APP_VERSION
    ?? (command === 'serve' ? 'development' : new Date().toISOString())

  return {
    base: '/metronome/',
    define: { __APP_BUILD_ID__: JSON.stringify(buildId) },
    plugins: [vue()],
    server: {
      headers: { 'Service-Worker-Allowed': '/metronome/' },
    },
    test: { environment: 'jsdom' },
  }
})
