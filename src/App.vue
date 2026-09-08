<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMetronomeStore } from './stores/metronome'

const metronome = useMetronomeStore()
const { beat, bpm, isPlaying } = storeToRefs(metronome)
</script>

<template>
  <div class="shell">
    <header>
      <RouterLink to="/" class="brand" aria-label="Metronome home"><span class="brand-dot" />METRONOME</RouterLink>
      <div class="app-status" :class="{ active: isPlaying }" role="status" aria-live="polite">
        <span class="status-light" />
        {{ isPlaying ? `Playing · ${bpm} BPM` : 'Ready' }}
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
