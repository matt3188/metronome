import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initializeAnalytics } from './services/analytics'
import './styles.css'

initializeAnalytics(router)

createApp(App).use(createPinia()).use(router).mount('#app')
