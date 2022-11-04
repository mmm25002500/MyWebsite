import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'

const routes = [
  {
    path: '/',
    name: '夏特稀個人網站',
    component: HomePage
  },
  {
    path: '/about',
    name: '關於夏特稀',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutMe.vue')
  },
  {
    path: '/myfriend',
    name: '夏特稀的好朋友',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/MyfriendPage.vue')
  },
  {
    path: '/menu',
    name: '選單',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/MenuPage.vue')
  },
  {
    path: '/team',
    name: '創立團隊',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/TeamPage.vue'),
    children: [
      {
        path: 'more',
        name: '創立團隊',
        component: () => import(/* webpackChunkName: "about" */ '../views/TeamMore.vue')
      },
      {
        path: 'signup',
        name: '加入靈萌',
        component: () => import(/* webpackChunkName: "about" */ '../views/TeamJoin.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.name
  next()
})

export default router
