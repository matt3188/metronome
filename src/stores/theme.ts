import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const storageKey = 'metronome-theme'

const preferredTheme = (): Theme => {
  const savedTheme = localStorage.getItem(storageKey)
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(preferredTheme())

  const apply = () => {
    document.documentElement.dataset.theme = theme.value
    document.documentElement.style.colorScheme = theme.value
  }

  const toggle = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem(storageKey, theme.value)
    apply()
  }

  apply()

  return { theme, toggle }
})
