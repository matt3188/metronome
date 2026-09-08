<script setup lang="ts">
defineProps<{ bpm: number; active: boolean; label?: string }>()
defineEmits<{ press: [] }>()
</script>
<template>
  <button class="tempo-card" :class="{ active }" :aria-pressed="active" @click="$emit('press')">
    <span class="tempo-value">{{ bpm }}</span><span class="tempo-unit">BPM</span>
    <span class="play-icon" aria-hidden="true">{{ active ? 'Ⅱ' : '▶' }}</span>
    <span class="tempo-label">{{ label ?? 'Tap to play' }}</span>
  </button>
</template>
