import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import AboutGoal from '@/assets/data/AboutGoal.json'
import AboutMe from '@/assets/data/AboutMe.json'

// 遍歷所有的文章
function getRoutes (BlogEntries, path, ComponentPath) {
  const routerGoal = []

  for (let i = 0; i < BlogEntries.length; i++) {
    routerGoal.push({
      path: `${path}${BlogEntries[i].id}`,
      name: BlogEntries[i].title,
      component: () => import(`@/assets/data/${ComponentPath}${BlogEntries[i].id}.md`)
    })
  }
  return routerGoal
}

// 定義路由表
const routes = [
  {
    path: '/',
    name: '夏特稀個人網站',
    component: HomePage
  },
  {
    path: '/projects',
    name: '我的專案',
    component: () => import(/* webpackChunkName: "about" */ '../views/ProjectPage.vue')
  },
  {
    path: '/about',
    name: '關於夏特稀',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutPage/AboutPage.vue'),
    children: [
      {
        path: 'me',
        name: '關於我',
        component: () => import(/* webpackChunkName: "skill" */ '../views/AboutPage/AboutMe.vue')
      },
      {
        path: 'goal',
        name: '我的目標',
        component: () => import(/* webpackChunkName: "skill" */ '../views/AboutPage/AboutGoal.vue')
      },
      {
        path: 'friends',
        name: '我的好朋友們',
        component: () => import(/* webpackChunkName: "skill" */ '../views/AboutPage/AboutFriends.vue')
      },
      {
        path: 'donate',
        name: '贊助',
        component: () => import(/* webpackChunkName: "skill" */ '../views/AboutPage/AboutDonation.vue')
      },
      {
        path: 'contact',
        name: '聯絡我',
        component: () => import(/* webpackChunkName: "about" */ '../views/AboutPage/ContactMe.vue')
      },
      ...getRoutes(AboutMe, '/about/me/', 'AboutMe/'),
      ...getRoutes(AboutGoal, '/about/goal/', 'goal/')
      // {
      //   path: 'team',
      //   name: '',
      //   component: () => import(/* webpackChunkName: "skill" */ '../views/AboutMe.vue'),
      //   children: [
      //     {
      //       path: 'team1',
      //       name: '',
      //       component: () => import(/* webpackChunkName: "skill" */ '../views/AboutMe.vue')
      //     }
      // }
    ]
  },
  {
    path: '/stats',
    name: '統計',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/Statistics/StatisticsPage.vue'),
    children: [
      {
        path: 'yt',
        name: 'YouTube統計',
        component: () => import(/* webpackChunkName: "skill" */ '../views/Statistics/YouTubePage.vue')
      },
      {
        path: 'github',
        name: 'Github統計',
        component: () => import(/* webpackChunkName: "skill" */ '../views/Statistics/GithubPage.vue')
      }
    ]
  },
  {
    path: '/menu',
    name: '選單',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutPage/AboutFriends.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'ERR 404 找不到頁面ㄛ',
    component: () => import('../views/NotFound.vue')
  },
  {
    path: '/webchangelog',
    name: '更新日誌',
    component: () => import(/* webpackChunkName: "about" */ '../views/ChangeLog.vue')
  },
  {
    path: '/myface',
    name: '我可愛的臉',
    component: () => import(/* webpackChunkName: "about" */ '../views/MyFace.vue')
  }
]

// 執行路由表
const router = createRouter({
  history: createWebHistory(),
  scrollBehavior (to, from, savedPosition) {
    return { left: 0, top: 0 }
  },
  routes
})

// 將 name 自動賦予至 head 中的 title
router.beforeEach((to, from, next) => {
  document.title = to.name
  next()
})

export default router
