import { redirectRoutes } from './redirects'

export const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/works',
    name: 'works',
    component: () => import('../views/WorkList.vue'),
  },
  {
    path: '/works/:slug',
    name: 'WorkDetail',
    component: () => import('../views/WorkDetail.vue'),
  },
  {
    path: '/news',
    name: 'news',
    component: () => import('../views/EventList.vue'),
  },
  {
    path: '/news/:slug',
    name: 'NewsDetail',
    component: () => import('../views/EventDetail.vue'),
  },
  {
    path: '/join',
    name: 'join',
    component: () => import('../views/PlaceholderView.vue'),
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/PlaceholderView.vue'),
  },
  {
    path: '/archive/products',
    name: 'archiveProducts',
    component: () => import('../views/PlaceholderView.vue'),
  },
  {
    path: '/archive/products/:slug',
    name: 'archiveProductDetail',
    component: () => import('../views/ProductDetail.vue'),
  },
  ...redirectRoutes(),
]

export default routes
