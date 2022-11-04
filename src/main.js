import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const styles = 'background-color: #80FFFF; color: #FF0000; font-style: bold; border: 1px solid pink; font-size: 4em;'
console.log('%c討厭拉！不要亂看人家的Console\n ヽ(́◕◞౪◟◕‵)ﾉ', styles)
const x = {
  我的姓名: '夏特稀',
  我的年紀: 17,
  我喜歡的東東: '寫code, Thinking, 拍/剪影片'
}
console.table(x, 'About me')

const app = createApp(App)

const DEFAULT_TITLE = 'Some Default Title'
router.afterEach((to, from) => {
  app.nextTick(() => {
    document.title = to.meta.title || DEFAULT_TITLE
  })
})

app.use(router)
// app.use(jQuery)
app.mount('#app')
