import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/cards',
    name: 'Cards',
    component: () => import('../views/CardsView.vue')
  },
  {
    path: '/words',
    name: 'Words',
    component: () => import('../views/WordsView.vue')
  },
  {
    path: '/achievements',
    name: 'achievements',
    component: () => import('../views/AchievementsView.vue')
  },
  {
    path: '/report',
    name: 'report',
    component: () => import('../views/ReportView.vue')
  },
  {
    path: '/shop',
    name: 'shop',
    component: () => import('../views/ShopView.vue')
  },
  {
    path: '/parent',
    name: 'parent',
    component: () => import('../views/ParentView.vue')
  },
  {
    path: '/garden',
    name: 'garden',
    component: () => import('../views/GardenView.vue')
  },
  {
    path: '/weekly-exam',
    name: 'weeklyExam',
    component: () => import('../views/WeeklyExamView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
