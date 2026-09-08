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
          :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
          :title="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
          @click="themeStore.toggle"
        >
          <span aria-hidden="true">{{ theme === 'dark' ? '☀' : '☾' }}</span>
          <span class="theme-label">{{ theme === 'dark' ? 'Light' : 'Dark' }}</span>
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
