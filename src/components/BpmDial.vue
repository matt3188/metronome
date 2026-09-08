<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ modelValue: number; active: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const angle = computed(() => ((props.modelValue - 30) / 210) * 270 - 135)
</script>
<template>
  <div class="dial" :class="{ active }" :style="{ '--angle': `${angle}deg` }">
    <input aria-label="Tempo in beats per minute" type="range" min="30" max="240" :value="modelValue" @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))" />
    <div class="dial-tick" /><div class="dial-center"><strong>{{ modelValue }}</strong><span>BPM</span></div>
  </div>
</template>
