<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps<{
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
const dragOffset = ref({ x: 0, y: 0 })
let timer: ReturnType<typeof setTimeout> | undefined
let pointerId: number | undefined
let holdTarget: HTMLElement | undefined
let holdOrigin: { x: number; y: number } | undefined
let suppressPress = false
const isDragging = computed(() => held.value && !props.preset)
const dragStyle = computed(() => isDragging.value
  ? { '--drag-x': `${dragOffset.value.x}px`, '--drag-y': `${dragOffset.value.y}px` }
  : undefined)
const startHold = (event: PointerEvent) => {
  held.value = false
  suppressPress = false
  dragOffset.value = { x: 0, y: 0 }
  pointerId = event.pointerId
  holdTarget = event.currentTarget as HTMLElement
  holdOrigin = { x: event.clientX ?? 0, y: event.clientY ?? 0 }

  if (props.editing && !props.preset) {
    held.value = true
    holdTarget.setPointerCapture?.(pointerId)
    return
  }

  timer = setTimeout(() => {
    held.value = true
    holdTarget?.setPointerCapture?.(pointerId!)
    emit('longpress')
  }, 550)
}
const cancelHold = (event?: PointerEvent) => {
  if (timer) clearTimeout(timer)
  timer = undefined
  const wasHeld = held.value
  held.value = false
  suppressPress = wasHeld
  if (wasHeld && event) emit('dragend')
  if (pointerId !== undefined && holdTarget?.hasPointerCapture?.(pointerId)) holdTarget.releasePointerCapture?.(pointerId)
  pointerId = undefined
  holdTarget = undefined
  holdOrigin = undefined
  dragOffset.value = { x: 0, y: 0 }
}
const drag = (event: PointerEvent) => {
  if (held.value && holdOrigin) {
    dragOffset.value = { x: event.clientX - holdOrigin.x, y: event.clientY - holdOrigin.y }
    emit('dragmove', { x: event.clientX, y: event.clientY })
  }
}
const leave = (event: PointerEvent) => {
  if (!held.value) cancelHold(event)
}
const press = () => {
  if (held.value || suppressPress) {
    held.value = false
    suppressPress = false
    return
  }
  emit('press')
}
onBeforeUnmount(cancelHold)
</script>
<template>
  <article
    class="tempo-card-wrap"
    :class="{ editing, preset, dragging: dragging || isDragging }"
    :style="dragStyle"
    :data-tempo="bpm"
    :data-custom-tempo="preset ? undefined : ''"
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
