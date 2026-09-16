<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import BpmDial from '../components/BpmDial.vue'
import TempoButton from '../components/TempoButton.vue'
import { isBuiltInTempo } from '../constants/tempos'
import { useMetronomeStore } from '../stores/metronome'
import { usePresetsStore, type DashboardItem } from '../stores/presets'

const metronome = useMetronomeStore()
const presets = usePresetsStore()
const { bpm, pitch, isPlaying } = storeToRefs(metronome)
const editing = ref(false)
const movedTempos = ref(new Set<number>())
const draggedTempo = ref<number | null>(null)
const setEditing = (value: boolean) => {
  if (value && !editing.value) movedTempos.value = new Set()
  editing.value = value
}
const draggingItem = ref<DashboardItem>()
const setEditing = (value: boolean) => {
  editing.value = value
  if (!value) draggingItem.value = undefined
}
const dashboardItem = (element: HTMLElement) => Number(element.dataset.dashboardTempo)
const itemAtPoint = (item: DashboardItem, point: { x: number; y: number }) => {
  const topElement = document.elementFromPoint?.(point.x, point.y)
  const elements = document.elementsFromPoint?.(point.x, point.y)
    ?? (topElement ? [topElement] : [])

  const hitTarget = elements
    .map(element => element.closest<HTMLElement>('[data-dashboard-tempo]'))
    .find(element => element && dashboardItem(element) !== item)
  if (hitTarget) return hitTarget

  // Some mobile browsers return only the pointer-captured (dragged) element from
  // elementsFromPoint. Checking the other cards' geometry keeps reordering
  // working while the dragged tile is rendered above them.
  return [...document.querySelectorAll<HTMLElement>('[data-dashboard-tempo]')]
    .filter(element => dashboardItem(element) !== item)
    .find(element => {
      const bounds = element.getBoundingClientRect()
      return point.x >= bounds.left && point.x <= bounds.right
        && point.y >= bounds.top && point.y <= bounds.bottom
    })
}
const dragItem = (item: DashboardItem, point: { x: number; y: number }) => {
  draggingItem.value = item
  const target = itemAtPoint(item, point)
  if (!target) return
  presets.moveDashboardTo(item, dashboardItem(target))
}
const startDrag = (tempo: number) => { draggedTempo.value = tempo }
const dropOn = (tempo: number) => {
  if (draggedTempo.value === null || draggedTempo.value === tempo) return
  presets.moveTo(draggedTempo.value, presets.visibleTempos.indexOf(tempo))
  movedTempos.value.add(draggedTempo.value)
}
</script>
<template>
  <section class="hero">
    <p class="eyebrow">YOUR TEMPO</p><h1>Find your<br><em>rhythm.</em></h1>
    <p class="lede">Choose a tempo to start instantly. The live beat display stays visible while you explore.</p>
  </section>
  <section class="dashboard-dial" aria-labelledby="dashboard-dial-title">
    <div class="dashboard-dial-copy">
      <p class="eyebrow">FINE TUNE</p>
      <h2 id="dashboard-dial-title">Set your BPM</h2>
      <p>Turn the dial, save your tempo, or tap a preset below.</p>
      <button
        class="add-preset"
        type="button"
        :disabled="isCurrentTempoPreset"
        @click="addCurrentTempo"
      >{{ isCurrentTempoPreset ? '✓ In presets' : `＋ Add ${bpm} BPM to presets` }}</button>
    </div>
    <BpmDial
      :model-value="bpm"
      :active="isPlaying"
      @update:model-value="metronome.setTempo"
      @toggle="metronome.toggle()"
    />
  </section>
  <div class="tempo-grid-heading">
    <p>{{ editing ? 'Drag to arrange · remove any card' : 'Press and hold a tempo to edit' }}</p>
    <button type="button" :aria-pressed="editing" @click="setEditing(!editing)">{{ editing ? 'Done' : 'Manage' }}</button>
  </div>
  <section class="tempo-grid" :class="{ editing }" aria-label="Quick tempos">
    <TempoButton
      v-for="(tempo, index) in presets.visibleTempos"
      :key="tempo"
      :bpm="tempo"
      :active="isPlaying && bpm === tempo"
      :editing="editing"
      :moved="movedTempos.has(tempo)"
      :can-move-earlier="index > 0"
      :can-move-later="index < presets.visibleTempos.length - 1"
      :preset="isBuiltInTempo(tempo)"
      :label="isBuiltInTempo(tempo) ? 'Preset tempo' : 'Saved tempo'"
      @longpress="setEditing(true)"
      @press="editing ? undefined : metronome.toggle(tempo)"
      @remove="presets.remove(tempo)"
      @move="moveTempo(tempo, $event)"
      @dragstart="startDrag(tempo)"
      @drop="dropOn(tempo)"
    />
    <RouterLink to="/custom" class="custom-card"><span class="plus">＋</span><strong>Custom</strong><small>Set your own pace</small></RouterLink>
  </section>
  <section v-if="editing && presets.availablePresets.length" class="preset-library" aria-labelledby="preset-library-title">
    <div><h2 id="preset-library-title">Preset library</h2><p>Removed presets stay here, ready to add back.</p></div>
    <button v-for="tempo in presets.availablePresets" :key="tempo" type="button" @click="presets.restorePreset(tempo)">＋ {{ tempo }} BPM</button>
  </section>
</template>
