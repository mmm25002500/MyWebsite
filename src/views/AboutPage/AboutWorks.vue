<template>
  <div>
    <h2>我的作品集</h2>
    <p>這些是從我開始寫程式到現在還能找到的專案、影片、網站，裡面這些內容可以看出我從最一開始的新手到現在的規模，裡面的作品都是我花了很久的時候做的。例如影片，從剛開始的威力導演到現在的 Premiere 和 After Effects，剪接和特效功力有大大提升，有句說得好：「技術就是經驗累積而成的，只有不斷失敗才會成功」。網站也是我利用課餘時間製作的，從早期只會 HTML 基本，到現在的 CSS 和 avascript 併用，或者用點 Vue.JS 都是在正常不過的了！</p>
    <div class="form-floating text-dark mb-3">
      <textarea class="form-control" placeholder="搜尋條目" id="searchDeveloper" v-model="cacheSearch"></textarea>
      <label for="searchDeveloper">搜尋條目</label>
      <div v-if="cacheSearch" class="text-white">
        目前搜索到: {{ searchData.length }} 個條目
      </div>
    </div>
    <!-- <div class="btn-group" role="group" aria-label="Basic radio toggle button group mb-3">
      <div class="mb-3">
        <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off" @click="change('')" checked>
        <label class="btn btn-outline-info text-white" for="btnradio2">全部</label>
      </div>
    </div> -->

    <!-- 如果只有一個，那就滿版 -->
    <!-- :link="svn_url" 把連結加上去 -->
    <div v-if="searchData.length === 1
">
        <Card
          v-for="(item, key) in searchData"
          :key="key"
          :title="item.name"
          :tag="``+item.id"
          :short="item.full_name"
          :content="item.description"
          :isMore="true"
          >
        </Card>
      </div>
      <!-- 如果兩個以上，就分割成兩欄 -->
      <div v-else>
          <div class="row row-cols-1 g-4 row-cols-md-2">
            <div class="col" v-for="(item, key) in searchData" :key="key">
              <Card
                :key="key"
                :title="item.name"
                :tag="``+item.id"
                :short="item.full_name"
                :content="item.description"
                :isMore="true"
              ></Card>
            </div>
          </div>
      </div>
  </div>
</template>

<script>
import Card from '@/components/AboutPage/TextSection.vue'
export default {
  name: 'AboutWorks',
  components: {
    Card
  },
  data () {
    return {
      cacheSearch: '',
      searchData: [],
      githubRepo: []
    }
  },
  methods: {
    getGithubRepo () {
      this.$http.get('https://api.github.com/users/mmm25002500/repos')
        .then((res) => {
          this.githubRepo.push.apply(this.githubRepo, res.data)
        })
    },
    getGithubPRData () {
      const apiURL = 'https://api.github.com/users/Cutespirit-Team/repos'
      this.$http.get(apiURL).then((res) => {
        this.githubRepo.push.apply(this.githubRepo, res.data)
      })
    }
  },
  created () {
    this.getGithubRepo()
    this.getGithubPRData()
    this.searchData = this.githubRepo
  },
  watch: {
    cacheSearch: function (val) {
      this.searchData = this.githubRepo.filter((item) => {
        // 如果沒有搜尋到 name
        if (String(item.name).toUpperCase().includes(this.cacheSearch.toUpperCase())) {
          return item.name.toUpperCase().includes(this.cacheSearch.toUpperCase())
        } else if (String(item.full_name).toUpperCase().includes(this.cacheSearch.toUpperCase())) {
          return item.full_name.toUpperCase().includes(this.cacheSearch.toUpperCase())
        } else if (String(item.description).toUpperCase().includes(this.cacheSearch.toUpperCase())) {
          return item.description.toUpperCase().includes(this.cacheSearch.toUpperCase())
        } else if (String(item.language).toUpperCase().includes(this.cacheSearch.toUpperCase())) {
          return item.language.toUpperCase().includes(this.cacheSearch.toUpperCase())
        } else {
          return false
        }
      })
    }
  }
}
</script>
