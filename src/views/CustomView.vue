<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import BpmDial from '../components/BpmDial.vue'
import { useMetronomeStore } from '../stores/metronome'
import { usePresetsStore } from '../stores/presets'

const metronome = useMetronomeStore()
const presets = usePresetsStore()
const { bpm, beat, isPlaying, remainingSeconds, sessionMinutes } = storeToRefs(metronome)
const saved = ref(false)
const countdown = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})
const adjust = (amount: number) => metronome.setTempo(bpm.value + amount)
const save = () => { presets.add(bpm.value); saved.value = true }
watch(bpm, () => { saved.value = false })
</script>
<template>
  <section class="custom-page">
    <RouterLink to="/" class="back">← <span>Back</span></RouterLink>
    <p class="eyebrow">CUSTOM TEMPO</p><h1>Make it <em>yours.</em></h1>
    <BpmDial :model-value="bpm" :active="isPlaying" @update:model-value="metronome.setTempo" />
    <div class="adjustments"><button @click="adjust(-5)">−5</button><button @click="adjust(-1)">−1</button><button @click="adjust(1)">+1</button><button @click="adjust(5)">+5</button></div>
    <div class="session" :class="{ active: isPlaying }">
      <template v-if="isPlaying">
        <span>{{ sessionMinutes ? 'TIME REMAINING' : 'OPEN SESSION' }}</span>
        <strong class="countdown" role="timer" aria-live="off">{{ sessionMinutes ? countdown : '∞' }}</strong>
        <div class="session-meta"><span>{{ bpm }} BPM</span><div class="session-beats" aria-label="Four beat measure"><i v-for="index in 4" :key="index" :class="{ active: beat % 4 === index - 1 }" /></div></div>
      </template>
      <template v-else>
        <span>SESSION LENGTH</span>
        <div class="segments"><button v-for="option in [0, 1, 3, 5]" :key="option" :class="{ selected: sessionMinutes === option }" @click="sessionMinutes = option">{{ option ? `${option} min` : '∞' }}</button></div>
      </template>
    </div>
    <button class="primary" @click="metronome.toggle()"><span>{{ isPlaying ? 'Ⅱ' : '▶' }}</span>{{ isPlaying ? 'Pause' : 'Start session' }}</button>
    <button class="save" @click="save">{{ saved || presets.tempos.includes(bpm) ? '✓ Saved to home' : '＋ Add to home' }}</button>
  </section>
</template>
