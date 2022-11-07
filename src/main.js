import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'
import VueUseWebp from 'vue-use-webp'

/* import font awesome icon component */
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { fab } from '@fortawesome/free-brands-svg-icons'
import BootstrapVue3 from 'bootstrap-vue-3'

const styles = 'background-color: #80FFFF; color: #FF0000; font-style: bold; border: 1px solid pink; font-size: 4em;'
console.log('%c討厭拉！不要亂看人家的Console\n ヽ(́◕◞౪◟◕‵)ﾉ', styles)
const x = {
  我的姓名: '夏特稀',
  我的年紀: 17,
  我喜歡的東東: '寫code, Thinking, 拍/剪影片'
}
console.table(x, 'About me')

library.add(fas, fab)

const app = createApp(App)
console.log(app)
// const DEFAULT_TITLE = 'Some Default Title'
router.afterEach((to, from) => {
  app.nextTick(() => {
    if (to.meta.title) {
      document.title = to.meta.title
    } else {
      document.title = 'Some Default Title'
    }
  })
})
app.use(router)
app.use(VueUseWebp)
app.use(BootstrapVue3)
app.component('font-awesome-icon', FontAwesomeIcon)
app.config.productionTip = false
app.mount('#app')
