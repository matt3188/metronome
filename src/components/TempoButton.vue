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
let touchPointer = false
let suppressClickTimer: ReturnType<typeof setTimeout> | undefined
const isDragging = computed(() => held.value)
const dragStyle = computed(() => isDragging.value
  ? { '--drag-x': `${dragOffset.value.x}px`, '--drag-y': `${dragOffset.value.y}px` }
  : undefined)
const startHold = (event: PointerEvent) => {
  // Stop mobile browsers from turning a long press into text selection or a
  // callout. Touch taps are emitted on pointerup because this cancels the
  // browser's compatibility click on some devices.
  touchPointer = event.pointerType === 'touch' || event.pointerType === 'pen'
  if (touchPointer) event.preventDefault()
  held.value = false
  suppressPress = false
  dragOffset.value = { x: 0, y: 0 }
  pointerId = event.pointerId
  holdTarget = event.currentTarget as HTMLElement
  holdOrigin = { x: event.clientX ?? 0, y: event.clientY ?? 0 }

  if (props.editing) {
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
  if (!wasHeld && event && touchPointer) {
    emit('press')
    suppressPress = true
  }
  if (suppressClickTimer) clearTimeout(suppressClickTimer)
  if (suppressPress) suppressClickTimer = setTimeout(() => { suppressPress = false }, 500)
  if (pointerId !== undefined && holdTarget?.hasPointerCapture?.(pointerId)) holdTarget.releasePointerCapture?.(pointerId)
  pointerId = undefined
  holdTarget = undefined
  holdOrigin = undefined
  touchPointer = false
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
onBeforeUnmount(() => {
  if (suppressClickTimer) clearTimeout(suppressClickTimer)
  cancelHold()
})
</script>
<template>
  <article
    class="tempo-card-wrap"
    :class="{ editing, preset, dragging: dragging || isDragging }"
    :style="dragStyle"
    :data-tempo="bpm"
    :data-dashboard-item="bpm"
    data-dashboard-tempo
  >
    <button
      class="tempo-card"
      :class="{ active }"
      :aria-pressed="active"
      :aria-label="`${bpm} BPM${editing ? (preset ? ', preset tempo' : ', custom tempo') : ''}`"
      @click="press"
      @pointerdown="startHold"
      @pointermove="drag"
      @pointerup="cancelHold"
      @pointercancel="cancelHold"
      @pointerleave="leave"
      @selectstart.prevent
      @contextmenu.prevent
      draggable="false"
    >
      <span class="tempo-value">{{ bpm }}</span><span class="tempo-unit">BPM</span>
      <span class="play-icon" aria-hidden="true">{{ active ? 'Ⅱ' : '▶' }}</span>
      <span class="tempo-label">{{ editing ? (preset ? 'Preset tempo' : 'Custom tempo') : (label ?? 'Tap to play') }}</span>
    </button>
    <button v-if="editing" type="button" class="remove-tempo" :aria-label="`Remove ${bpm} BPM from dashboard`" @click="$emit('remove')">−</button>
    <div v-if="editing" class="tempo-actions" :aria-label="`${bpm} BPM reorder controls`">
      <button type="button" :disabled="!canMoveEarlier" :aria-label="`Move ${bpm} BPM earlier`" @click="$emit('move', -1)">←</button>
      <button type="button" :disabled="!canMoveLater" :aria-label="`Move ${bpm} BPM later`" @click="$emit('move', 1)">→</button>
    </div>
  </article>
</template>
