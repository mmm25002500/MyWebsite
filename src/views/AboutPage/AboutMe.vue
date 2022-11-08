<template>
  <div id="wrapper">

    <!-- Header -->
    <header id="header">
      <h1>About Me</h1>
      <p>大家好，我是夏特稀，我是一名高中生，喜歡在課餘時候研究程式語言相關的東西。</p>
    </header>
   <!-- Nav -->
    <!-- <nav id="nav">
      <ul>
        <li v-for="(item, key) in mySelf" :key="key">
          <a :href="`#`+item.tag">
            {{item.name}}
          </a>
        </li>
      </ul>
    </nav> -->
    <div class="form-floating text-dark mb-3">
      <textarea class="form-control" placeholder="搜尋條目" id="searchDeveloper" v-model="cacheSearch"></textarea>
      <label for="searchDeveloper">搜尋條目</label>
    </div>
    <div class="btn-group" role="group" aria-label="Basic radio toggle button group mb-3">
      <div class="mb-3">
        <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off" @click="change('')" checked>
        <label class="btn btn-outline-info text-white" for="btnradio2">全部</label>
      </div>
      <div v-for="(item, key) in data" :key="key" class="mb-3">
        <input :href="`#`+item.name" type="radio" class="btn-check" name="btnradio" :id="item.name" autocomplete="off" @click="change(item.tag)">
        <label class="btn btn-outline-info text-white" :for="item.name">{{ item.name }}</label>
      </div>
    </div>

    <!-- Main -->
    <div id="main">
      <!-- <span class="image main"><img src="images/pic04.jpg" alt="" /></span> -->

      <!-- 如果只有一個，那就滿版 -->
      <div v-if="searchData.length === 1">
        <Card
          v-for="(item, key) in searchData"
          :key="key"
          :title="item.name"
          :tag="item.tag"
          :short="item.EngName"
          :content="item.content"
          >
        </Card>
      </div>
      <!-- 如果兩個以上，就分割成兩欄 -->
      <div v-else>
          <div class="row row-cols-1 g-4 row-cols-md-2">
            <div class="col" v-for="(item, key) in searchData" :key="key">
              <Card
                :title="item.name"
                :tag="item.tag"
                :short="item.EngName"
                :content="item.content"
              ></Card>
            </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
import Card from '@/components/AboutPage/TextSection.vue'
export default {
  components: {
    Card
  },
  data () {
    return {
      cacheSearch: '',
      searchData: [],
      data: [
        {
          name: '介紹',
          EngName: 'Introduction',
          tag: 'Introduction',
          content: '我自國小以來就對程式有興趣 在國小四年級嘗試安裝Linux來玩，走了不少苦坑路，但一切都是值得的，我也享受其。我從國小開始使用Linux 因為看到駭客覺得很帥 我國小很羨慕會做遊戲的人 於是我就上網尋找如何做遊戲 找著找著就找到一個可以使用預定好的版面來做程式 當然這還不符合我的胃口 我就開始上網找如何寫程式 到後來就會寫網頁了 於是我在國小五年級還是六年級的時候就寫了一個網頁罵別人被帶到訓導處 然後我就覺得好爽 我就開始走上了我的駭客之路～～'
        },
        {
          name: '經歷',
          EngName: 'Experience',
          tag: 'Experience',
          content: '目前研究Java有5餘年有了 Python則只有短短2–3年 另外我的主力從國小的Ubuntu 到現在使用了有4年 CentOS有1年了 Kali-Linux也有5年了 是使用雙系統的方式 現在的主力是Arch-Linux 確實Arch的pacman更新的確比apt來得快 且使用pacman 下載比較不會造成檔案過多 因為apt他是一直安裝 較容易造成硬碟很滿 之後可能會裝入BlackArch 因為我是從駭客思路與成長起家的麻。'
        },
        {
          name: '成長路程',
          EngName: 'Life Growth process',
          tag: 'Life_Growth_process',
          content: '我自兩歲就有電腦了 但都沒在用 只是在玩摩爾莊園而已 對！我不玩賽爾號…那種畫面整個是藍色的我不喜歡 所以每天幾乎都是跟手機在一起 家人也不想我玩電腦 所以我國小就是手機陪伴著我 寫程式也用手機 那你問我我是如何創立網站的 因為當時有個東西叫做 Blogger 部落格 我就利用部落格來創立網站 而標題就寫 XXX很XX 所以我並不會瞧不起手機用戶 但我會瞧不起說手機比電腦優秀的人 手機能做到的 電腦大部分都做得到 而電腦能作到的 手機卻不行 但隨著時代的進步 相信以後可以的 拉回主題來 我到了國一的時候 就嘗試使用Termux攻擊網站 我也成了全校電腦能力最強的人 也因為到了國一 我也開始使用電腦了 那時候真的打字超快 為何呢 因為手機鍵盤跟電腦一樣 所以我打字都很快 一分鐘可以到80字 從此我就成為了全校電腦最強的人 到了國二 我已經會抓學校網站漏洞了 也會使用注入攻擊學校網站 從過二開始也漸漸培養我的資訊安全 我在國二時 幾乎每天都用匿名聊天 在使用termux去嘗試得到FB帳密 或是Shell 所以我在國二也培養了社交工程和技術 到了國三正值鳳凰花開時期 也因為會考 還有第九節課 我也縮短了時間 但也沒縮短多少 當時 已經磨練了 Kali-linux遇到錯誤就是重灌的經驗 但一次次被我解決了 當時最怕的是dpkg子進程錯誤 Google都找遍了都沒有找到 我從小到那時候 全部靠自己 沒有旁人幫助 也因為這樣 「爬文」與排除問題 成為了我的日常！！'
        },
        {
          name: '創立團隊',
          EngName: 'Found The Team',
          tag: 'Found_The_Team',
          content: '我的團隊目前已經至少有5年了 從一開始只有一兩個人 到目前已經有上百個人加入我們了 包括Line群組 Telegram群組 以及Facebook上志同道合與擁有共同目標的好朋友們。在2015的時候創立了團隊 當時只有2個人 為了一起學習電腦這方面 我開始拍攝YouTube 雖然當時都是廢片 但我從小六開始 轉為技術片了 從After Effect特效 到APP介紹 到Google Play開發者應用上傳 目前為止已經有1013訂閱 但因為2020/2月初我因為在YouTube直播上播放版權音樂遭到停用 我立馬通知YouTube解鎖 然而等不到下文 而我又開立了新頻道 短短6個月得來200訂閱 我開始轉為駭客教學 更技術的影片 幸虧有團隊幫忙 我才能走得這麼快 雖然團內都是一群小廢廢 真正跟我一起研究也只不過那幾個人而已 但我已經很開心了～ 未來的你們呢 也要跟我一起研究呦～'
        },
        {
          name: '我的連絡資訊',
          EngName: 'My Contact Information',
          tag: 'myContactInfomation',
          content: `
          <table class="table table-dark table-striped">
            <tr>
              <td>項目</td>
              <td>連結</td>
            </tr>
            <tr>
              <td>我的Email</td>
              <td><a href="mailto:admin@tershi.com">admin@tershi.com</a></td>
            </tr>
            <tr>
              <td>我的Gmail</td>
              <td><a href="mailto:marryhan25648@gmail.com">marryhan25648@gmail.com</a></td>
            </tr>
            <tr>
              <td>我的Telegram</td>
              <td><a href="https://t.me/TershiXia">@TershiXia</a></td>
            </tr>
            <tr>
              <td>我的Facebook</td>
              <td>http://fb.com/TershiXia</td>
            </tr>
            <tr>
              <td>我的Instagram</td>
              <td><a href="https://www.instagram.com/tershixia/">@TershiXia</a></td>
            </tr>
            <tr>
              <td>我的Twitter</td>
              <td><a href="https://twitter.com/TershiXia">@TershiXia</a></td>
            </tr>
            <tr>
              <td>我的Discord</td>
              <td>夏特稀#1219</td>
            </tr>
            <!--<tr>
              <td></td>
              <td></td>
            </tr>-->
          </table>
          `
        }
      ]
    }
  },
  watch: {
    cacheSearch: function (val) {
      this.searchData = this.data.filter((item) => {
        // 如果沒有搜尋到 name
        if (item.name.includes(this.cacheSearch)) {
          return item.name.includes(this.cacheSearch)
        } else if (item.EngName.includes(this.cacheSearch)) {
          return item.EngName.includes(this.cacheSearch)
        } else if (item.content.includes(this.cacheSearch)) {
          return item.content.includes(this.cacheSearch)
        } else if (item.tag.includes(this.cacheSearch)) {
          return item.tag.includes(this.cacheSearch)
        } else {
          return false
        }
      })
    }
  },
  created () {
    this.searchData = this.data
  },
  methods: {
    change (name) {
      this.cacheSearch = name
    }
  }
}
</script>
