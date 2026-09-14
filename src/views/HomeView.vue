<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import CustomTile from '../components/CustomTile.vue'
import TempoButton from '../components/TempoButton.vue'
import { BUILT_IN_TEMPOS } from '../constants/tempos'
import { useMetronomeStore } from '../stores/metronome'
import { CUSTOM_TILE, usePresetsStore } from '../stores/presets'
import type { DashboardItem } from '../stores/presets'

const metronome = useMetronomeStore()
const presets = usePresetsStore()
const { bpm, pitch, isPlaying } = storeToRefs(metronome)
const editing = ref(false)
const draggingItem = ref<DashboardItem>()
const setEditing = (value: boolean) => {
  editing.value = value
  if (!value) draggingItem.value = undefined
}
const itemAtPoint = (item: DashboardItem, point: { x: number; y: number }) => {
  const topElement = document.elementFromPoint?.(point.x, point.y)
  const elements = document.elementsFromPoint?.(point.x, point.y)
    ?? (topElement ? [topElement] : [])

  const hitTarget = elements
    .map(element => element.closest<HTMLElement>('[data-dashboard-item]'))
    .find(element => element && element.dataset.dashboardItem !== String(item))
  if (hitTarget) return hitTarget

  // Some mobile browsers return only the pointer-captured (dragged) element from
  // elementsFromPoint. Checking the other cards' geometry keeps reordering
  // working while the dragged tile is rendered above them.
  return [...document.querySelectorAll<HTMLElement>('[data-dashboard-item]')]
    .filter(element => element.dataset.dashboardItem !== String(item))
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
  const value = target.dataset.dashboardItem
  const targetItem = value === CUSTOM_TILE ? CUSTOM_TILE : Number(value)
  presets.moveDashboardTo(item, targetItem)
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
        :dragging="draggingItem === item"
        :can-move-earlier="index > 0"
        :can-move-later="index < presets.dashboardItems.length - 1"
        :label="`${presets.pitches[item] ?? 'high'} pitch`"
        @longpress="setEditing(true)"
        @press="editing ? undefined : metronome.toggle(item, presets.pitches[item] ?? 'high')"
        @remove="presets.removeFromDashboard(item)"
        @move="presets.moveDashboard(item, $event)"
        @dragmove="dragItem(item, $event)"
        @dragend="draggingItem = undefined"
      />
      <CustomTile v-else :editing="editing" :dragging="draggingItem === CUSTOM_TILE" :can-move-earlier="index > 0" :can-move-later="index < presets.dashboardItems.length - 1" @move="presets.moveDashboardItem(CUSTOM_TILE, $event)" @dragmove="dragItem(CUSTOM_TILE, $event)" @dragend="draggingItem = undefined" />
    </template>
  </section>
  <section v-if="editing && presets.removedTempos.length" class="removed-presets" aria-label="Removed tempo tray">
    <div><strong>Removed tempos</strong><small>Add a tempo back to your dashboard.</small></div>
    <button v-for="tempo in presets.removedTempos" :key="tempo" type="button" :aria-label="`Restore ${tempo} BPM`" @click="presets.restoreTempo(tempo)">＋ {{ tempo }} BPM</button>
  </section>
</template>
