<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import BpmDial from '../components/BpmDial.vue'
import TempoButton from '../components/TempoButton.vue'
import { BUILT_IN_TEMPOS } from '../constants/tempos'
import { useMetronomeStore } from '../stores/metronome'
import { usePresetsStore, type DashboardItem } from '../stores/presets'

const metronome = useMetronomeStore()
const presets = usePresetsStore()
const { bpm, pitch, isPlaying } = storeToRefs(metronome)
const editing = ref(false)
const selectedPreset = ref<number | null>(null)
const isCurrentTempoPreset = computed(() => presets.dashboardItems.includes(bpm.value))
const canOverwritePreset = computed(() => selectedPreset.value !== null && selectedPreset.value !== bpm.value)
const addCurrentTempo = () => {
  presets.add(bpm.value, pitch.value)
  presets.restoreTempo(bpm.value)
}
const selectPreset = (tempo: number) => {
  selectedPreset.value = tempo
  metronome.toggle(tempo, presets.pitches[tempo] ?? 'high')
}
const overwritePreset = () => {
  if (selectedPreset.value === null) return
  presets.overwrite(selectedPreset.value, bpm.value, pitch.value)
  selectedPreset.value = bpm.value
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
      <button
        v-if="canOverwritePreset"
        class="overwrite-preset"
        type="button"
        @click="overwritePreset"
      >Overwrite {{ selectedPreset }} BPM preset with {{ bpm }} BPM</button>
    </div>
    <BpmDial
      :model-value="bpm"
      :active="isPlaying"
      @update:model-value="metronome.setTempo"
      @toggle="metronome.toggle()"
    />
  </section>
  <div class="tempo-grid-heading">
    <p>{{ editing ? 'Drag any tempo to rearrange' : 'Press and hold any tempo to edit' }}</p>
    <button type="button" :aria-pressed="editing" @click="setEditing(!editing)">{{ editing ? 'Done' : 'Manage' }}</button>
  </div>
  <section class="tempo-grid" :class="{ editing }" aria-label="Quick tempos">
    <template v-for="(item, index) in presets.dashboardItems" :key="item">
      <TempoButton
        :bpm="item"
        :active="bpm === item && pitch === (presets.pitches[item] ?? 'high')"
        :editing="editing"
        :preset="BUILT_IN_TEMPOS.some(tempo => tempo === item)"
        :dragging="draggingItem === item"
        :can-move-earlier="index > 0"
        :can-move-later="index < presets.dashboardItems.length - 1"
        :label="`${presets.pitches[item] ?? 'high'} pitch`"
        @longpress="setEditing(true)"
        @press="editing ? undefined : selectPreset(item)"
        @remove="presets.removeFromDashboard(item)"
        @move="presets.moveDashboard(item, $event)"
        @dragmove="dragItem(item, $event)"
        @dragend="draggingItem = undefined"
      />
    </template>
  </section>
  <section v-if="editing && presets.removedTempos.length" class="removed-presets" aria-label="Removed tempo tray">
    <div><strong>Removed tempos</strong><small>Add a tempo back to your dashboard.</small></div>
    <button v-for="tempo in presets.removedTempos" :key="tempo" type="button" :aria-label="`Restore ${tempo} BPM`" @click="presets.restoreTempo(tempo)">＋ {{ tempo }} BPM</button>
  </section>
</template>
