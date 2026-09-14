<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{ modelValue: number; active: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const angle = computed(() => ((props.modelValue - 30) / 210) * 270 - 135)
const dial = ref<HTMLElement>()
const dragging = ref(false)

const updateFromPointer = (event: PointerEvent) => {
  if (!dial.value) return

  const bounds = dial.value.getBoundingClientRect()
  const pointerAngle = (Math.atan2(
    event.clientY - (bounds.top + bounds.height / 2),
    event.clientX - (bounds.left + bounds.width / 2),
  ) * 180 / Math.PI + 90 + 360) % 360
  let progress = (pointerAngle - 225 + 360) % 360

  // The dial has a 90-degree dead zone at the bottom. Snap pointers in that
  // zone to the nearest end rather than unexpectedly wrapping the tempo.
  if (progress > 270) progress = progress < 315 ? 270 : 0
  emit('update:modelValue', 30 + Math.round((progress / 270) * 210))
}

const startDrag = (event: PointerEvent) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  dragging.value = true
  dial.value?.setPointerCapture?.(event.pointerId)
  updateFromPointer(event)
}

const drag = (event: PointerEvent) => {
  if (dragging.value) updateFromPointer(event)
}

const stopDrag = (event: PointerEvent) => {
  if (!dragging.value) return
  dragging.value = false
  if (dial.value?.hasPointerCapture?.(event.pointerId)) dial.value.releasePointerCapture(event.pointerId)
}
</script>
<template>
  <div
    ref="dial"
    class="dial"
    :class="{ active }"
    :style="{ '--angle': `${angle}deg` }"
    @pointerdown.prevent="startDrag"
    @pointermove.prevent="drag"
    @pointerup="stopDrag"
    @pointercancel="stopDrag"
  >
    <input aria-label="Tempo in beats per minute" type="range" min="30" max="240" :value="modelValue" @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))" />
    <div class="dial-tick" /><div class="dial-center"><strong>{{ modelValue }}</strong><span>BPM</span></div>
  </div>
</template>
