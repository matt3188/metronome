<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import BpmDial from '../components/BpmDial.vue'
import { useMetronomeStore } from '../stores/metronome'
import { usePresetsStore } from '../stores/presets'

const metronome = useMetronomeStore()
const presets = usePresetsStore()
const { bpm, pitch, isPlaying } = storeToRefs(metronome)
const saved = ref(false)
const isSaved = computed(() => saved.value || (
  presets.tempos.includes(bpm.value) && (presets.pitches[bpm.value] ?? 'high') === pitch.value
))
const adjust = (amount: number) => metronome.setTempo(bpm.value + amount)
const save = () => { presets.add(bpm.value, pitch.value); saved.value = true }
watch([bpm, pitch], () => { saved.value = false })
</script>
<template>
  <section class="custom-page">
    <RouterLink to="/" class="back">← <span>Back</span></RouterLink>
    <p class="eyebrow">CUSTOM TEMPO</p><h1>Make it <em>yours.</em></h1>
    <BpmDial :model-value="bpm" :active="isPlaying" @update:model-value="metronome.setTempo" />
    <div class="adjustments"><button @click="adjust(-5)">−5</button><button @click="adjust(-1)">−1</button><button @click="adjust(1)">+1</button><button @click="adjust(5)">+5</button></div>
    <div class="sound-picker">
      <div><strong>Metronome pitch</strong><small>Choose how each beat sounds</small></div>
      <div class="pitch-options" aria-label="Metronome pitch">
        <button v-for="option in (['high', 'low'] as const)" :key="option" type="button" :class="{ selected: pitch === option }" :aria-pressed="pitch === option" @click="metronome.setPitch(option)">{{ option }}</button>
      </div>
    </div>
    <button class="preview" type="button" @click="metronome.previewPitch()"><span aria-hidden="true">♪</span> Preview {{ pitch }} sound</button>
    <button class="save" @click="save">{{ isSaved ? '✓ Saved to home' : '＋ Add to home' }}</button>
  </section>
</template>
