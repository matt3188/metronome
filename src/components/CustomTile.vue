<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{ editing: boolean; canMoveEarlier: boolean; canMoveLater: boolean; dragging: boolean }>()
const emit = defineEmits<{ move: [direction: -1 | 1]; dragmove: [point: { x: number; y: number }]; dragend: [] }>()
const held = ref(false)
const origin = ref({ x: 0, y: 0 })
const offset = ref({ x: 0, y: 0 })
const style = computed(() => held.value
  ? { '--drag-x': `${offset.value.x}px`, '--drag-y': `${offset.value.y}px` }
  : undefined)

const start = (event: PointerEvent) => {
  if (!props.editing) return
  event.preventDefault()
  held.value = true
  origin.value = { x: event.clientX, y: event.clientY }
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
}
const drag = (event: PointerEvent) => {
  if (!held.value) return
  offset.value = { x: event.clientX - origin.value.x, y: event.clientY - origin.value.y }
  emit('dragmove', { x: event.clientX, y: event.clientY })
}
const end = () => {
  if (held.value) emit('dragend')
  held.value = false
  offset.value = { x: 0, y: 0 }
}
</script>

<template>
  <article class="tempo-card-wrap custom-tile" :class="{ editing, dragging: dragging || held }" :style="style" data-dashboard-item="custom">
    <RouterLink
      to="/custom"
      class="custom-card"
      :aria-disabled="editing"
      @click="editing && $event.preventDefault()"
      @pointerdown="start"
      @pointermove="drag"
      @pointerup="end"
      @pointercancel="end"
    ><span class="plus">＋</span><strong>Custom</strong><small>Set your own pace</small></RouterLink>
    <div v-if="editing" class="tempo-actions custom-tempo-actions" aria-label="Custom tile controls">
      <button type="button" :disabled="!canMoveEarlier" aria-label="Move Custom tile earlier" @click="$emit('move', -1)">←</button>
      <button type="button" :disabled="!canMoveLater" aria-label="Move Custom tile later" @click="$emit('move', 1)">→</button>
    </div>
  </article>
</template>
