<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import TempoButton from '../components/TempoButton.vue'
import { BUILT_IN_TEMPOS } from '../constants/tempos'
import { useMetronomeStore } from '../stores/metronome'
import { CUSTOM_TILE, usePresetsStore } from '../stores/presets'

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
    .map(element => element.closest<HTMLElement>('[data-dashboard-tempo]'))
    .find(element => element && Number(element.dataset.tempo) !== tempo)
  if (hitTarget) return hitTarget

  // Some mobile browsers return only the pointer-captured (dragged) element from
  // elementsFromPoint. Checking the other cards' geometry keeps reordering
  // working while the dragged tile is rendered above them.
  return [...document.querySelectorAll<HTMLElement>('[data-dashboard-tempo]')]
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
  presets.moveDashboardTo(tempo, targetTempo)
}
</script>
<template>
  <section class="hero">
    <p class="eyebrow">YOUR TEMPO</p><h1>Find your<br><em>rhythm.</em></h1>
    <p class="lede">Choose a tempo to start instantly. The live beat display stays visible while you explore.</p>
  </section>
  <div class="tempo-grid-heading">
    <p>{{ editing ? 'Drag any tempo to rearrange' : 'Press and hold any tempo to edit' }}</p>
    <button type="button" :aria-pressed="editing" @click="setEditing(!editing)">{{ editing ? 'Done' : 'Manage' }}</button>
  </div>
  <section class="tempo-grid" :class="{ editing }" aria-label="Quick tempos">
    <template v-for="(item, index) in presets.dashboardItems" :key="item">
      <TempoButton
        v-if="item !== CUSTOM_TILE"
        :bpm="item"
        :active="isPlaying && bpm === item && pitch === (presets.pitches[item] ?? 'high')"
        :editing="editing"
        :preset="BUILT_IN_TEMPOS.includes(item as 50 | 100)"
        :dragging="draggingTempo === item"
        :can-move-earlier="index > 0"
        :can-move-later="index < presets.dashboardItems.length - 1"
        :label="`${presets.pitches[item] ?? 'high'} pitch`"
        @longpress="setEditing(true)"
        @press="editing ? undefined : metronome.toggle(item, presets.pitches[item] ?? 'high')"
        @remove="presets.removeFromDashboard(item)"
        @move="presets.moveDashboard(item, $event)"
        @dragmove="dragTempo(item, $event)"
        @dragend="draggingTempo = undefined"
      />
      <article v-else class="tempo-card-wrap custom-tile" :class="{ editing }">
        <RouterLink to="/custom" class="custom-card" :aria-disabled="editing" @click="editing && $event.preventDefault()"><span class="plus">＋</span><strong>Custom</strong><small>Set your own pace</small></RouterLink>
        <div v-if="editing" class="tempo-actions custom-tempo-actions" aria-label="Custom tile controls">
          <button type="button" :disabled="index === 0" aria-label="Move Custom tile earlier" @click="presets.moveDashboardItem(CUSTOM_TILE, -1)">←</button>
          <button type="button" :disabled="index === presets.dashboardItems.length - 1" aria-label="Move Custom tile later" @click="presets.moveDashboardItem(CUSTOM_TILE, 1)">→</button>
        </div>
      </article>
    </template>
  </section>
  <section v-if="editing && presets.removedBuiltIns.length" class="removed-presets" aria-label="Removed preset tempos">
    <div><strong>Removed presets</strong><small>Restore a preset to your dashboard.</small></div>
    <button v-for="tempo in presets.removedBuiltIns" :key="tempo" type="button" @click="presets.restoreBuiltIn(tempo)">＋ {{ tempo }} BPM</button>
  </section>
</template>
