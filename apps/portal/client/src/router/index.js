import { createRouter, createWebHistory } from 'vue-router'
import PortalHomeView from '../views/PortalHomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: PortalHomeView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
