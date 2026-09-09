<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

defineProps<{
  bpm: number
  active: boolean
  label?: string
  editing?: boolean
  preset?: boolean
  canMoveEarlier?: boolean
  canMoveLater?: boolean
  dragging?: boolean
}>()
const emit = defineEmits<{ press: []; longpress: []; remove: []; move: [direction: -1 | 1]; dragmove: [point: { x: number; y: number }]; dragend: [] }>()

const held = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let pointerId: number | undefined
let holdTarget: HTMLElement | undefined
const startHold = (event: PointerEvent) => {
  held.value = false
  pointerId = event.pointerId
  holdTarget = event.currentTarget as HTMLElement
  timer = setTimeout(() => {
    held.value = true
    holdTarget?.setPointerCapture?.(pointerId!)
    emit('longpress')
  }, 550)
}
const cancelHold = (event?: PointerEvent) => {
  if (timer) clearTimeout(timer)
  timer = undefined
  if (held.value && event) emit('dragend')
  if (pointerId !== undefined && holdTarget?.hasPointerCapture?.(pointerId)) holdTarget.releasePointerCapture?.(pointerId)
  pointerId = undefined
  holdTarget = undefined
}
const drag = (event: PointerEvent) => {
  if (held.value) emit('dragmove', { x: event.clientX, y: event.clientY })
}
const leave = (event: PointerEvent) => {
  if (!held.value) cancelHold(event)
}
const press = () => {
  if (held.value) {
    held.value = false
    return
  }
  emit('press')
}
onBeforeUnmount(cancelHold)
</script>
<template>
  <article
    class="tempo-card-wrap"
    :class="{ editing, preset, dragging }"
    :data-tempo="bpm"
  >
    <button
      class="tempo-card"
      :class="{ active }"
      :aria-pressed="active"
      :aria-label="`${bpm} BPM${editing ? (preset ? ', built-in preset' : ', custom tempo') : ''}`"
      @click="press"
      @pointerdown="startHold"
      @pointermove="drag"
      @pointerup="cancelHold"
      @pointercancel="cancelHold"
      @pointerleave="leave"
      @contextmenu.prevent
    >
      <span class="tempo-value">{{ bpm }}</span><span class="tempo-unit">BPM</span>
      <span class="play-icon" aria-hidden="true">{{ active ? 'Ⅱ' : '▶' }}</span>
      <span class="tempo-label">{{ editing ? (preset ? 'Built-in · locked' : 'Custom tempo') : (label ?? 'Tap to play') }}</span>
    </button>
    <div v-if="editing && !preset" class="tempo-actions" aria-label="Custom tempo controls">
      <button type="button" :disabled="!canMoveEarlier" :aria-label="`Move ${bpm} BPM earlier`" @click="$emit('move', -1)">←</button>
      <button type="button" class="remove-tempo" :aria-label="`Remove ${bpm} BPM`" @click="$emit('remove')">×</button>
      <button type="button" :disabled="!canMoveLater" :aria-label="`Move ${bpm} BPM later`" @click="$emit('move', 1)">→</button>
    </div>
    <span v-else-if="editing" class="preset-lock" aria-hidden="true">🔒</span>
  </article>
</template>
