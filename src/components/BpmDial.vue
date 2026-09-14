<script setup lang="ts">
import { computed, ref } from 'vue'

const MIN_BPM = 30
const MAX_BPM = 240
const ARC_DEGREES = 270
const props = defineProps<{ modelValue: number; active: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const angle = computed(() => ((props.modelValue - MIN_BPM) / (MAX_BPM - MIN_BPM)) * ARC_DEGREES - ARC_DEGREES / 2)
const draggingPointer = ref<number | null>(null)

const updateFromPointer = (event: PointerEvent) => {
  const dial = event.currentTarget as HTMLElement
  const bounds = dial.getBoundingClientRect()
  const x = event.clientX - (bounds.left + bounds.width / 2)
  const y = event.clientY - (bounds.top + bounds.height / 2)
  let pointerAngle = Math.atan2(y, x) * 180 / Math.PI + 90
  pointerAngle = ((pointerAngle + 180) % 360 + 360) % 360 - 180
  pointerAngle = Math.min(ARC_DEGREES / 2, Math.max(-ARC_DEGREES / 2, pointerAngle))

  const progress = (pointerAngle + ARC_DEGREES / 2) / ARC_DEGREES
  emit('update:modelValue', Math.round(MIN_BPM + progress * (MAX_BPM - MIN_BPM)))
}

const startDrag = (event: PointerEvent) => {
  draggingPointer.value = event.pointerId
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  updateFromPointer(event)
}

const drag = (event: PointerEvent) => {
  if (draggingPointer.value === event.pointerId) updateFromPointer(event)
}

const endDrag = (event: PointerEvent) => {
  if (draggingPointer.value === event.pointerId) draggingPointer.value = null
}
</script>
<template>
  <div
    class="dial"
    :class="{ active, dragging: draggingPointer !== null }"
    :style="{ '--angle': `${angle}deg` }"
    @pointerdown.prevent="startDrag"
    @pointermove.prevent="drag"
    @pointerup="endDrag"
    @pointercancel="endDrag"
  >
    <input aria-label="Tempo in beats per minute" type="range" min="30" max="240" :value="modelValue" @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))" />
    <div class="dial-tick" /><div class="dial-center"><strong>{{ modelValue }}</strong><span>BPM</span></div>
  </div>
</template>
