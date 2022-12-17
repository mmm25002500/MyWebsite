import { createApp } from 'vue'
import App from './App.vue'
import router from './routers'

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'
import VueUseWebp from 'vue-use-webp'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import BootstrapVue3 from 'bootstrap-vue-3'
import 'animate.css'

import axios from 'axios'
import VueAxios from 'vue-axios'
// import Ads from 'vue-google-adsense'

import VueVideoPlayer from '@videojs-player/vue'
import 'video.js/dist/video-js.css'
// import BackToTop from 'vue-backtotop'

// 在開發者的 console 中顯示警告資訊
const styles = 'background-color: #80FFFF; color: #FF0000; font-style: bold; border: 1px solid pink; font-size: 4em;'
console.log('%c討厭拉！不要亂看人家的Console\n ヽ(́◕◞౪◟◕‵)ﾉ', styles)
const x = {
  我的姓名: '夏特稀',
  我的年紀: 17,
  我喜歡的東東: '寫code, Thinking, 拍/剪影片'
}
console.table(x, 'About me')

// 將 fontawesome 的 icon 放入 library 中
library.add(fas, fab, far)

const app = createApp(App)
// const DEFAULT_TITLE = 'Some Default Title'
// 自動標題(好像跟 router/index.js 的衝突了)
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
// app.use(Vue3Transitions)
app.use(require('vue-script2'))
app.use(VueAxios, axios)
app.use(VueVideoPlayer)
// app.use(BackToTop)

// 將廣告載入
// app.use(Ads.AutoAdsense, {
//   adClient: 'ca-pub-9107487734392446',
//   isNewAdsCode: true,
//   dataAdSlot: '1443478648',
//   dataAdFormat: 'auto',
//   dataFullWidthResponsive: 'true'
// })
// app.use(Ads.Adsense)
// app.use(Ads.InArticleAdsense)
// app.use(Ads.InFeedAdsense)

// 載入元件
app.component('font-awesome-icon', FontAwesomeIcon)

// 把提示關閉
app.config.productionTip = false
app.mount('#app')
