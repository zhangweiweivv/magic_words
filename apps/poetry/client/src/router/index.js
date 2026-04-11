import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/article/:articleId',
    name: 'article',
    component: () => import('../views/ArticleView.vue')
  },
  {
    path: '/article/:articleId/detail',
    name: 'article-detail',
    component: () => import('../views/ArticleDetailView.vue')
  },
  {
    path: '/parent',
    name: 'parent',
    component: () => import('../views/ParentView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
