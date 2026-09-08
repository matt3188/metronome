import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import CustomView from './views/CustomView.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/custom', name: 'custom', component: CustomView },
  ],
})
