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
const draggingTempo = ref<number>()
const setEditing = (value: boolean) => {
  editing.value = value
  if (!value) draggingTempo.value = undefined
}
const tempoAtPoint = (tempo: number, point: { x: number; y: number }) => {
  const elements = document.elementsFromPoint?.(point.x, point.y)
    ?? [document.elementFromPoint(point.x, point.y)].filter((element): element is Element => element !== null)

  return elements
    .map(element => element.closest<HTMLElement>('[data-custom-tempo]'))
    .find(element => element && Number(element.dataset.tempo) !== tempo)
}
const dragTempo = (tempo: number, point: { x: number; y: number }) => {
  draggingTempo.value = tempo
  const target = tempoAtPoint(tempo, point)
  if (!target) return
  const targetTempo = Number(target.dataset.tempo)
  presets.moveTo(tempo, targetTempo)
}
</script>
<template>
  <section class="hero">
    <p class="eyebrow">YOUR TEMPO</p><h1>Find your<br><em>rhythm.</em></h1>
    <p class="lede">Choose a tempo to start instantly. The live beat display stays visible while you explore.</p>
  </section>
  <div class="tempo-grid-heading">
    <p>{{ editing ? 'Drag custom tempos to rearrange' : 'Press and hold any tempo to edit' }}</p>
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
      :dragging="draggingTempo === tempo"
      :can-move-earlier="index > 0"
      :can-move-later="index < presets.tempos.length - 1"
      label="Saved tempo"
      @longpress="setEditing(true)"
      @press="editing ? undefined : metronome.toggle(tempo)"
      @remove="presets.remove(tempo)"
      @move="presets.move(tempo, $event)"
      @dragmove="dragTempo(tempo, $event)"
      @dragend="draggingTempo = undefined"
    />
    <RouterLink to="/custom" class="custom-card"><span class="plus">＋</span><strong>Custom</strong><small>Set your own pace</small></RouterLink>
  </section>
</template>
