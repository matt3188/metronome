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
const emit = defineEmits<{ press: []; longpress: []; remove: []; move: [direction: -1 | 1]; dragstart: []; drop: [] }>()

const held = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
let timer: ReturnType<typeof setTimeout> | undefined
let pointerId: number | undefined
let holdOrigin: { x: number; y: number } | undefined
let suppressPress = false
let suppressClickTimer: ReturnType<typeof setTimeout> | undefined
const isDragging = computed(() => held.value && !props.preset)
const dragStyle = computed(() => isDragging.value
  ? { '--drag-x': `${dragOffset.value.x}px`, '--drag-y': `${dragOffset.value.y}px` }
  : undefined)
const removePointerListeners = () => {
  window.removeEventListener('pointermove', drag)
  window.removeEventListener('pointerup', cancelHold)
  window.removeEventListener('pointercancel', cancelHold)
}
const startHold = (event: PointerEvent) => {
  if (pointerId !== undefined) return
  if (event.pointerType === 'touch' || event.pointerType === 'pen') event.preventDefault()
  held.value = false
  suppressPress = false
  dragOffset.value = { x: 0, y: 0 }
  pointerId = event.pointerId
  holdOrigin = { x: event.clientX ?? 0, y: event.clientY ?? 0 }
  window.addEventListener('pointermove', drag, { passive: false })
  window.addEventListener('pointerup', cancelHold)
  window.addEventListener('pointercancel', cancelHold)

  if (props.editing) {
    held.value = true
    return
  }

  timer = setTimeout(() => {
    held.value = true
    emit('longpress')
  }, 550)
}
const finishPointer = (event: PointerEvent) => {
  const wasHeld = held.value
  cancelHold(event)
  if (!wasHeld && (event.pointerType === 'touch' || event.pointerType === 'pen')) {
    emit('press')
    suppressPress = true
    if (suppressClickTimer) clearTimeout(suppressClickTimer)
    suppressClickTimer = setTimeout(() => { suppressPress = false }, 500)
  }
}
function cancelHold(event?: PointerEvent) {
  if (event && pointerId !== undefined && event.pointerId !== pointerId) return
  if (timer) clearTimeout(timer)
  timer = undefined
  const wasHeld = held.value
  held.value = false
  suppressPress = wasHeld
  if (wasHeld && event) emit('dragend')
  removePointerListeners()
  pointerId = undefined
  holdOrigin = undefined
  dragOffset.value = { x: 0, y: 0 }
}
function drag(event: PointerEvent) {
  if (pointerId === undefined || event.pointerId !== pointerId) return
  if (held.value && holdOrigin) {
    event.preventDefault()
    dragOffset.value = { x: event.clientX - holdOrigin.x, y: event.clientY - holdOrigin.y }
    emit('dragmove', { x: event.clientX, y: event.clientY })
  }
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
    :class="{ editing, preset, movable: editing && !moved && (canMoveEarlier || canMoveLater) }"
    :draggable="editing ? 'true' : 'false'"
    @dragstart="$emit('dragstart')"
    @dragover.prevent
    @drop.prevent="$emit('drop')"
  >
    <button
      class="tempo-card"
      :class="{ active }"
      :aria-pressed="active"
      :aria-label="`${bpm} BPM${editing ? (preset ? ', preset' : ', custom tempo') : ''}`"
      @click="press"
      @pointerdown="startHold"
      @pointermove.stop="drag"
      @pointerup="finishPointer"
      @contextmenu.prevent
      draggable="false"
    >
      <span class="tempo-value">{{ bpm }}</span><span class="tempo-unit">BPM</span>
      <span class="play-icon" aria-hidden="true">{{ active ? 'Ⅱ' : '▶' }}</span>
      <span class="tempo-label">{{ editing ? (preset ? 'Preset' : 'Custom tempo') : (label ?? 'Tap to play') }}</span>
    </button>
    <div v-if="editing" class="tempo-actions" :aria-label="`${bpm} BPM controls`">
      <button type="button" :disabled="!canMoveEarlier" :aria-label="`Move ${bpm} BPM earlier`" @click="$emit('move', -1)">←</button>
      <button type="button" :disabled="!canMoveLater" :aria-label="`Move ${bpm} BPM later`" @click="$emit('move', 1)">→</button>
    </div>
  </article>
</template>
