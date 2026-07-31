import { redirectRoutes } from './redirects'

export const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/recruitment',
    name: 'recruitment',
    component: () => import('../views/RecruitmentView.vue'),
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('../views/ProductList.vue'),
  },
  {
    path: '/products/:slug',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail.vue'),
  },
  {
    path: '/events',
    name: 'EventList',
    component: () => import('../views/EventList.vue'),
  },
  {
    path: '/events/:slug',
    name: 'EventDetail',
    component: () => import('../views/EventDetail.vue'),
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
  ...redirectRoutes(),
]

export default routes
