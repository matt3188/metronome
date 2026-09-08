<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import BpmDial from '../components/BpmDial.vue'
import { useMetronomeStore } from '../stores/metronome'
import { usePresetsStore } from '../stores/presets'

const metronome = useMetronomeStore()
const presets = usePresetsStore()
const { bpm, isPlaying, sessionMinutes } = storeToRefs(metronome)
const saved = ref(false)
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
    <div class="session"><span>SESSION LENGTH</span><div class="segments"><button v-for="option in [0, 5, 10, 20]" :key="option" :class="{ selected: sessionMinutes === option }" @click="sessionMinutes = option">{{ option ? `${option} min` : '∞' }}</button></div></div>
    <button class="primary" @click="metronome.toggle()"><span>{{ isPlaying ? 'Ⅱ' : '▶' }}</span>{{ isPlaying ? 'Pause' : 'Start session' }}</button>
    <button class="save" @click="save">{{ saved || presets.tempos.includes(bpm) ? '✓ Saved to home' : '＋ Add to home' }}</button>
  </section>
</template>
