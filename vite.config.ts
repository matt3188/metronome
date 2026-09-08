/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/metronome/',
  plugins: [vue()],
  test: { environment: 'jsdom' },
})
