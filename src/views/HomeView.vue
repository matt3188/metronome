<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import TempoButton from '../components/TempoButton.vue'
import { BUILT_IN_TEMPOS } from '../constants/tempos'
import { useMetronomeStore } from '../stores/metronome'
import { usePresetsStore } from '../stores/presets'

const metronome = useMetronomeStore()
const presets = usePresetsStore()
const { bpm, isPlaying } = storeToRefs(metronome)
const editing = ref(false)
const movedTempos = ref(new Set<number>())
const setEditing = (value: boolean) => {
  if (value && !editing.value) movedTempos.value = new Set()
  editing.value = value
}
const moveTempo = (tempo: number, direction: -1 | 1) => {
  presets.move(tempo, direction)
  movedTempos.value.add(tempo)
}
</script>
<template>
  <section class="hero">
    <p class="eyebrow">YOUR TEMPO</p><h1>Find your<br><em>rhythm.</em></h1>
    <p class="lede">Choose a tempo to start instantly. The live beat display stays visible while you explore.</p>
  </section>
  <div class="tempo-grid-heading">
    <p>{{ editing ? 'Arrange your custom tempos' : 'Press and hold a tempo to edit' }}</p>
    <button type="button" :aria-pressed="editing" @click="setEditing(!editing)">{{ editing ? 'Done' : 'Manage' }}</button>
  </div>
  <section class="tempo-grid" :class="{ editing }" aria-label="Quick tempos">
    <TempoButton v-for="tempo in BUILT_IN_TEMPOS" :key="tempo" :bpm="tempo" :active="isPlaying && bpm === tempo" :editing="editing" preset @longpress="setEditing(true)" @press="editing ? undefined : metronome.toggle(tempo)" />
    <TempoButton
      v-for="(tempo, index) in presets.tempos"
      :key="`preset-${tempo}`"
      :bpm="tempo"
      :active="isPlaying && bpm === tempo"
      :editing="editing"
      :moved="movedTempos.has(tempo)"
      :can-move-earlier="index > 0"
      :can-move-later="index < presets.tempos.length - 1"
      label="Saved tempo"
      @longpress="setEditing(true)"
      @press="editing ? undefined : metronome.toggle(tempo)"
      @remove="presets.remove(tempo)"
      @move="moveTempo(tempo, $event)"
    />
    <RouterLink to="/custom" class="custom-card"><span class="plus">＋</span><strong>Custom</strong><small>Set your own pace</small></RouterLink>
  </section>
</template>
