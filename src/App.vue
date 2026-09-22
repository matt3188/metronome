<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMetronomeStore } from './stores/metronome'
import { useThemeStore } from './stores/theme'
import { watchForPwaUpdates, type PwaUpdate } from './services/pwa'

const metronome = useMetronomeStore()
const themeStore = useThemeStore()
const { beat, bpm, isPlaying, pitch } = storeToRefs(metronome)
const { theme } = storeToRefs(themeStore)
const availableUpdate = ref<PwaUpdate>()
const feedbackOpen = ref(false)
const feedbackStatus = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const stopWatchingForUpdates = watchForPwaUpdates((update) => {
  availableUpdate.value = update
})

function openFeedback() {
  feedbackStatus.value = 'idle'
  feedbackOpen.value = true
}

function closeFeedback() {
  if (feedbackStatus.value !== 'sending') feedbackOpen.value = false
}

async function submitFeedback(event: Event) {
  const form = event.currentTarget as HTMLFormElement
  feedbackStatus.value = 'sending'

  try {
    const response = await fetch('https://formspree.io/f/xqpaqjnn', {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })

    feedbackStatus.value = response.ok ? 'sent' : 'error'
    if (response.ok) form.reset()
  } catch {
    feedbackStatus.value = 'error'
  }
}

onBeforeUnmount(stopWatchingForUpdates)
</script>

<template>
  <div class="shell">
    <aside v-if="availableUpdate" class="update-notice" role="status" aria-live="polite">
      <div>
        <strong>Update available</strong>
        <span>A new version of Metronome is ready.</span>
      </div>
      <button type="button" @click="availableUpdate.apply()">Update now</button>
    </aside>
    <header>
      <RouterLink to="/" class="brand" aria-label="Metronome home"><span class="brand-dot" />METRONOME</RouterLink>
      <div class="header-actions">
        <button
          class="pitch-toggle"
          type="button"
          role="switch"
          :aria-checked="pitch === 'low'"
          :aria-label="`Switch to ${pitch === 'high' ? 'low' : 'high'} pitch`"
          :title="`Switch to ${pitch === 'high' ? 'low' : 'high'} pitch`"
          @click="metronome.togglePitch"
        >
          <span class="pitch-option pitch-option-high" aria-hidden="true">High</span>
          <span class="pitch-option pitch-option-low" aria-hidden="true">Low</span>
          <span class="pitch-toggle-thumb" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 14v-4m5 7V7m5 13V4m5 11V9" />
            </svg>
          </span>
        </button>
        <button
          class="theme-toggle"
          type="button"
          role="switch"
          :aria-checked="theme === 'dark'"
          :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
          :title="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
          @click="themeStore.toggle"
        >
          <span class="theme-option theme-option-light" aria-hidden="true">Light</span>
          <span class="theme-option theme-option-dark" aria-hidden="true">Dark</span>
          <span class="theme-toggle-thumb" aria-hidden="true">
            <svg v-if="theme === 'dark'" viewBox="0 0 24 24">
              <path d="M20.1 15.5A8.4 8.4 0 0 1 8.5 3.9 8.4 8.4 0 1 0 20.1 15.5Z" />
            </svg>
            <svg v-else viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </span>
        </button>
      </div>
    </header>
    <main><RouterView /></main>
    <aside class="now-playing" :class="{ active: isPlaying }" aria-label="Metronome playback controls">
      <div>
        <span class="now-playing-label">{{ isPlaying ? 'Now playing' : 'Ready to play' }}</span>
        <strong>{{ bpm }} <small>BPM · {{ pitch }} pitch</small></strong>
      </div>
      <div class="beat-track" aria-label="Four beat measure">
        <span v-for="index in 4" :key="index" :class="{ active: isPlaying && beat % 4 === index - 1 }" />
      </div>
    </aside>
    <footer>
      <span>Keep time. Find your rhythm.</span>
      <button class="feedback-link" type="button" @click="openFeedback">
        Share feedback
        <span aria-hidden="true">＋</span>
      </button>
    </footer>

    <div v-if="feedbackOpen" class="feedback-backdrop" @click.self="closeFeedback">
      <section class="feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <button class="feedback-close" type="button" aria-label="Close feedback form" :disabled="feedbackStatus === 'sending'" @click="closeFeedback">×</button>

        <template v-if="feedbackStatus === 'sent'">
          <p class="eyebrow">MESSAGE SENT</p>
          <h2 id="feedback-title">Thanks for helping!</h2>
          <p class="feedback-intro">Your feedback has been sent. We appreciate you taking the time to share it.</p>
          <button class="feedback-submit" type="button" @click="closeFeedback">Done</button>
        </template>

        <form v-else @submit.prevent="submitFeedback">
          <p class="eyebrow">HELP US IMPROVE</p>
          <h2 id="feedback-title">Share feedback</h2>
          <p class="feedback-intro">Found a problem or have an idea? Tell us in your own words.</p>

          <label>
            What would you like to share?
            <select name="feedback_type" required>
              <option value="Bug report">Something isn’t working</option>
              <option value="Feature request">I have an idea</option>
              <option value="General feedback">Something else</option>
            </select>
          </label>

          <label>
            Tell us more
            <textarea name="message" rows="5" required placeholder="What happened, or what would you like Metronome to do?"></textarea>
          </label>

          <label>
            Your email <span>(optional)</span>
            <input name="email" type="email" autocomplete="email" placeholder="Only if you’d like a reply">
          </label>

          <p v-if="feedbackStatus === 'error'" class="feedback-error" role="alert">Sorry, we couldn’t send that. Please try again.</p>
          <button class="feedback-submit" type="submit" :disabled="feedbackStatus === 'sending'">
            {{ feedbackStatus === 'sending' ? 'Sending…' : 'Send feedback' }}
          </button>
        </form>
      </section>
    </div>
  </div>
</template>
