<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMetronomeStore } from './stores/metronome'
import { useThemeStore } from './stores/theme'

const metronome = useMetronomeStore()
const themeStore = useThemeStore()
const { beat, bpm, isPlaying } = storeToRefs(metronome)
const { theme } = storeToRefs(themeStore)
</script>

<template>
  <div class="shell">
    <header>
      <RouterLink to="/" class="brand" aria-label="Metronome home"><span class="brand-dot" />METRONOME</RouterLink>
      <div class="header-actions">
        <div class="app-status" :class="{ active: isPlaying }" role="status" aria-live="polite">
          <span class="status-light" />
          {{ isPlaying ? `Playing · ${bpm} BPM` : 'Ready' }}
        </div>
        <button
          class="theme-toggle"
          type="button"
          role="switch"
          :aria-checked="theme === 'dark'"
          :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
          :title="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
          @click="themeStore.toggle"
        >
          <span class="theme-option theme-option-light" aria-hidden="true">Light</span>
          <span class="theme-option theme-option-dark" aria-hidden="true">Dark</span>
          <span class="theme-toggle-thumb" aria-hidden="true">
            <svg v-if="theme === 'dark'" viewBox="0 0 24 24">
              <path d="M20.1 15.5A8.4 8.4 0 0 1 8.5 3.9 8.4 8.4 0 1 0 20.1 15.5Z" />
            </svg>
            <svg v-else viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </span>
        </button>
      </div>
    </header>
    <main><RouterView /></main>
    <aside v-if="isPlaying" class="now-playing" aria-label="Metronome playback controls">
      <div>
        <span class="now-playing-label">Now playing</span>
        <strong>{{ bpm }} <small>BPM</small></strong>
      </div>
      <div class="beat-track" aria-label="Four beat measure">
        <span v-for="index in 4" :key="index" :class="{ active: beat % 4 === index - 1 }" />
      </div>
      <button type="button" aria-label="Stop metronome" @click="metronome.stop">■</button>
    </aside>
    <footer>Keep time. Find your rhythm.</footer>
  </div>
</template>
