<script setup lang="ts">
defineProps<{
  editing: boolean
  canMoveEarlier: boolean
  canMoveLater: boolean
}>()

defineEmits<{
  move: [direction: -1 | 1]
}>()
</script>

<template>
  <article class="tempo-card-wrap custom-tile" :class="{ editing }">
    <RouterLink
      to="/custom"
      class="custom-card"
      :aria-disabled="editing"
      @click="editing && $event.preventDefault()"
    >
      <svg class="custom-cog" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.63h.01A1.7 1.7 0 0 0 10 3.08V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.37 9v.01A1.7 1.7 0 0 0 20.92 10H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
      </svg>
      <strong>Custom</strong>
      <small>Set your own pace</small>
    </RouterLink>
    <div v-if="editing" class="tempo-actions custom-tempo-actions" aria-label="Custom tile controls">
      <button type="button" :disabled="!canMoveEarlier" aria-label="Move Custom tile earlier" @click="$emit('move', -1)">←</button>
      <button type="button" :disabled="!canMoveLater" aria-label="Move Custom tile later" @click="$emit('move', 1)">→</button>
    </div>
  </article>
</template>

<style scoped>
.custom-cog {
  position: absolute;
  top: 25px;
  left: 50%;
  width: 76px;
  height: 76px;
  transform: translateX(-50%);
  fill: none;
  stroke: var(--lime);
  stroke-width: 1.35;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 14px color-mix(in srgb, var(--lime) 28%, transparent));
}
</style>
