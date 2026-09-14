<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import TempoButton from '../components/TempoButton.vue'
import { BUILT_IN_TEMPOS } from '../constants/tempos'
import { useMetronomeStore } from '../stores/metronome'
import { usePresetsStore } from '../stores/presets'

const metronome = useMetronomeStore()
const presets = usePresetsStore()
const { bpm, pitch, isPlaying } = storeToRefs(metronome)
const editing = ref(false)
const draggingTempo = ref<number>()
const setEditing = (value: boolean) => {
  editing.value = value
  if (!value) draggingTempo.value = undefined
}
const tempoAtPoint = (tempo: number, point: { x: number; y: number }) => {
  const topElement = document.elementFromPoint?.(point.x, point.y)
  const elements = document.elementsFromPoint?.(point.x, point.y)
    ?? (topElement ? [topElement] : [])

  const hitTarget = elements
    .map(element => element.closest<HTMLElement>('[data-custom-tempo]'))
    .find(element => element && Number(element.dataset.tempo) !== tempo)
  if (hitTarget) return hitTarget

  // Some mobile browsers return only the pointer-captured (dragged) element from
  // elementsFromPoint. Checking the other cards' geometry keeps reordering
  // working while the dragged tile is rendered above them.
  return [...document.querySelectorAll<HTMLElement>('[data-custom-tempo]')]
    .filter(element => Number(element.dataset.tempo) !== tempo)
    .find(element => {
      const bounds = element.getBoundingClientRect()
      return point.x >= bounds.left && point.x <= bounds.right
        && point.y >= bounds.top && point.y <= bounds.bottom
    })
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
      :active="isPlaying && bpm === tempo && pitch === (presets.pitches[tempo] ?? 'high')"
      :editing="editing"
      :dragging="draggingTempo === tempo"
      :can-move-earlier="index > 0"
      :can-move-later="index < presets.tempos.length - 1"
      :label="`${presets.pitches[tempo] ?? 'high'} pitch`"
      @longpress="setEditing(true)"
      @press="editing ? undefined : metronome.toggle(tempo, presets.pitches[tempo] ?? 'high')"
      @remove="presets.remove(tempo)"
      @move="presets.move(tempo, $event)"
      @dragmove="dragTempo(tempo, $event)"
      @dragend="draggingTempo = undefined"
    />
    <RouterLink to="/custom" class="custom-card"><span class="plus">＋</span><strong>Custom</strong><small>Set your own pace</small></RouterLink>
  </section>
</template>
