// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RecruitmentView from '../views/RecruitmentView.vue'
import zyzView from '../views/zyzView.vue';
import ProductList from '../views/ProductList.vue'
import ProductDetail from '../views/ProductDetail.vue'
import EventList from '../views/EventList.vue'
import EventDetail from '../views/EventDetail.vue'
import csd20View from '../views/projects/csd20.vue'
import csd20musicView from '../views/projects/csd20music.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/recruitment',
      name: 'recruitment',
      component: RecruitmentView
    },
    {
      path: '/project/zhu-yuanzhang', // 定义一个清晰的URL
      name: 'zhu-yuanzhang',
      component: zyzView
    },
    {
      path: '/products',
      name: 'products',
      component: ProductList
    },
    {
      path: '/products/:slug', // 路径中包含一个名为 "slug" 的动态参数
      name: 'ProductDetail',
      component: ProductDetail
      // Vue Router 会自动将URL中的 slug 部分作为参数传递给组件
    },
    {
      path: '/events', 
      name: 'EventList',
      component: EventList
    },
    {
      path: '/events/:slug',
      name: 'EventDetail',
      component: EventDetail
    },
    {
      path: '/project/csd20',
      name: 'csd20',
      component: csd20View
    },
    {
      path: '/project/csd20/music',
      name: 'csd20music',
      component: csd20musicView
    }

  ]
})

export default router