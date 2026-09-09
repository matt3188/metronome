<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

defineProps<{
  bpm: number
  active: boolean
  label?: string
  editing?: boolean
  preset?: boolean
  moved?: boolean
  canMoveEarlier?: boolean
  canMoveLater?: boolean
}>()
const emit = defineEmits<{ press: []; longpress: []; remove: []; move: [direction: -1 | 1] }>()

const held = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
const startHold = (event: PointerEvent) => {
  held.value = false
  // Prevent mobile browsers from retargeting a stationary long touch to text.
  if (event.currentTarget instanceof Element) {
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  timer = setTimeout(() => {
    held.value = true
    emit('longpress')
  }, 550)
}
const cancelHold = () => {
  if (timer) clearTimeout(timer)
  timer = undefined
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
    :class="{ editing, preset, movable: editing && !preset && !moved && (canMoveEarlier || canMoveLater) }"
  >
    <button
      class="tempo-card"
      :class="{ active }"
      :aria-pressed="active"
      :aria-label="`${bpm} BPM${editing ? (preset ? ', built-in preset' : ', custom tempo') : ''}`"
      @click="press"
      @pointerdown="startHold"
      @pointerup="cancelHold"
      @pointercancel="cancelHold"
      @contextmenu.prevent
      @selectstart.prevent
      @dragstart.prevent
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

<style scoped>
.tempo-card-wrap {
  min-width: 0;
  position: relative;
}

.tempo-card {
  width: 100%;
  -webkit-touch-callout: none;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
}

.editing .tempo-card {
  transform: none;
  border-color: color-mix(in srgb, var(--lime) 45%, var(--border));
  padding-bottom: 64px;
}

.movable {
  animation: tempo-wiggle .28s ease-in-out infinite alternate;
}

.preset.editing .tempo-card {
  border-style: dashed;
  opacity: .72;
}

.tempo-actions {
  position: absolute;
  z-index: 2;
  right: 12px;
  bottom: 12px;
  left: 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}

.tempo-actions button {
  height: 38px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-raised);
  color: var(--text);
  cursor: pointer;
  font-size: 18px;
}

.tempo-actions button:disabled {
  cursor: not-allowed;
  opacity: .25;
}

.tempo-actions .remove-tempo {
  background: #ff6b6430;
  color: #ff8a84;
}

.preset-lock {
  position: absolute;
  z-index: 2;
  bottom: 22px;
  left: 22px;
  font-size: 18px;
}

@keyframes tempo-wiggle {
  from { transform: rotate(-.55deg) translateY(-1px); }
  to { transform: rotate(.55deg) translateY(1px); }
}

@media (min-width: 650px) {
  .tempo-card { min-height: 240px; }
}

@media (prefers-reduced-motion: reduce) {
  .movable { animation: none; }
}
</style>
