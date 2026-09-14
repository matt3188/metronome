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
        <RouterLink to="/custom" class="custom-card" :aria-disabled="editing" @click="editing && $event.preventDefault()">
          <svg class="custom-cog" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.63h.01A1.7 1.7 0 0 0 10 3.08V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.37 9v.01A1.7 1.7 0 0 0 20.92 10H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
          </svg>
          <strong>Custom</strong><small>Set your own pace</small>
        </RouterLink>
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

<style scoped>
.custom-cog {
  position: absolute;
  top: 25px;
  left: 50%;
  width: 76px;
  height: 76px;
  transform: translateX(-50%);
  fill: none;
  stroke: var(--lime);
  stroke-width: 1.35;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 14px color-mix(in srgb, var(--lime) 28%, transparent));
}
</style>
