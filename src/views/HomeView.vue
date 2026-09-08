<script setup lang="ts">
import { storeToRefs } from 'pinia'
import TempoButton from '../components/TempoButton.vue'
import { useMetronomeStore } from '../stores/metronome'
import { usePresetsStore } from '../stores/presets'

const metronome = useMetronomeStore()
const presets = usePresetsStore()
const { bpm, isPlaying } = storeToRefs(metronome)
</script>
<template>
  <section class="hero">
    <p class="eyebrow">YOUR TEMPO</p><h1>Find your<br><em>rhythm.</em></h1>
    <p class="lede">Choose a tempo to start instantly. The live beat display stays visible while you explore.</p>
  </section>
  <section class="tempo-grid" aria-label="Quick tempos">
    <TempoButton v-for="tempo in [50, 100]" :key="tempo" :bpm="tempo" :active="isPlaying && bpm === tempo" @press="metronome.toggle(tempo)" />
    <TempoButton v-for="tempo in presets.tempos" :key="`preset-${tempo}`" :bpm="tempo" :active="isPlaying && bpm === tempo" label="Saved tempo" @press="metronome.toggle(tempo)" />
    <RouterLink to="/custom" class="custom-card"><span class="plus">＋</span><strong>Custom</strong><small>Set your own pace</small></RouterLink>
  </section>
</template>
