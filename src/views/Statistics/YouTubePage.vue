<template>
  <div>
    <h2>我的 YouTube 影片</h2>
    <p>這裡記錄著我跟我的生活的點點滴滴</p>

    <!-- 搜尋 -->
    <div class="input-group text-dark mb-3">
      <div class="form-floating">
        <textarea class="form-control" placeholder="搜尋夏特稀的影片ㄅ!" id="searchDeveloper" v-model="cacheSearch"></textarea>
        <label for="searchDeveloper">搜尋夏特稀的影片ㄅ!</label>
      </div>
      <button class="btn btn-warning" type="button" id="button-addon2" @click="cacheSearch=''">清除</button>
    </div>
    <div v-if="cacheSearch && searchData.length != 0" class="text-white">
      目前搜索到: {{ searchData.length }} 個條目
    </div>

    <p class="fs-6">小提示！可以點選名字查看詳細內容喔。 <br> 影片數量: {{ data.length }}</p>
    <div class="btn-group" role="group" aria-label="Basic radio toggle button group mb-3">
      <!-- 影片展開的按鈕 -->
      <Sidebar name="這是我的影片" content="點點看吧，可以展開喔" :data="data" @cache-search="getReturnData"></Sidebar>
    </div>

    <hr>

    <!-- 如果資料還沒抓下來 -->
    <div v-if="!data[0]">
      <div class="alert alert-danger d-flex justify-content-center align-items-center" role="alert">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">載入中... 請稍後...</span>
        </div>
        載入中...
      </div>
    </div>

    <!-- 如果找不到 -->
    <div v-if="!searchData[0]">
      <div class="alert alert-danger d-flex align-items-center" role="alert">
        <button type="button" class="btn-close align-self-start" data-bs-dismiss="alert" aria-label="Close"></button>
        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
        <div>
          找不到此影片
        </div>
      </div>
    </div>

    <!-- 除了頻道 -->
    <!-- 只有一個的時候 -->
    <div v-if="searchData.length == 1">
      <Card
      v-for="(item) in searchData"
      :key="item.id.videoId"
      @cache-search="getReturnData"
      :title="item.snippet.title"
      :videoid="item.id.videoId"
      :description="item.snippet.description"
      :publishTime="item.snippet.publishTime"
      :img="item.snippet.thumbnails.high.url"
      :channelTitle="item.snippet.channelTitle"
      card_style="width: 100%;"
      ></Card>
    </div>
    <!-- 有兩個以上的時候 -->
    <div class="row row-cols-1 g-4 row-cols-md-3" v-else>
      <Card
      v-for="(item) in searchData"
      :key="item.id.videoId"
      @cache-search="getReturnData"
      :title="item.snippet.title"
      :videoid="item.id.videoId"
      :description="item.snippet.description"
      :publishTime="item.snippet.publishTime"
      :img="item.snippet.thumbnails.high.url"
      :channelTitle="item.snippet.channelTitle"
      card_style="width: 100%;"
      ></Card>
    </div>
  </div>
</template>

<script>
import Card from '@/components/StatisticsPage/VideoCard.vue'
import Sidebar from '@/components/StatisticsPage/SidebarSection.vue'

export default {
  components: {
    Card,
    Sidebar
  },
  data () {
    return {
      data: [],
      searchData: [],
      cacheSearch: ''
    }
  },
  methods: {
    getYTData () {
      this.$http.get('https://api.tershi.com/getYTVids')
        .then((res) => {
          this.data = res.data.slice(0, -1)
          this.searchData = res.data.slice(0, -1)
        })
    },
    change (name) {
      this.cacheSearch = name
    },
    getReturnData (data) {
      this.cacheSearch = data
    }
  },
  created () {
    this.getYTData()
    // this.searchData = this.data
  },
  watch: {
    cacheSearch: function (val) {
      this.searchData = this.data.filter((item) => {
        if (item.snippet.title.toUpperCase().includes(this.cacheSearch.toUpperCase())) {
          return item.snippet.title.toUpperCase().includes(this.cacheSearch.toUpperCase())
          // 如果搜尋到 name
        } else if (item.id.videoId.toUpperCase().includes(this.cacheSearch.toUpperCase())) {
          return item.id.videoId.toUpperCase().includes(this.cacheSearch.toUpperCase())
          // 如果搜尋到 videoId
        } else if (item.snippet.channelTitle.toUpperCase().includes(this.cacheSearch.toUpperCase())) {
          return item.snippet.channelTitle.toUpperCase().includes(this.cacheSearch.toUpperCase())
          // 如果搜尋到 channelTitle
        } else if (item.snippet.description.toUpperCase().includes(this.cacheSearch.toUpperCase())) {
          return item.snippet.description.toUpperCase().includes(this.cacheSearch.toUpperCase())
          // 如果搜尋到 channelTitle
        } else if (item.snippet.publishTime.toUpperCase().includes(this.cacheSearch.toUpperCase())) {
          return item.snippet.publishTime.toUpperCase().includes(this.cacheSearch.toUpperCase())
          // 如果搜尋到 publishTime
        } else {
          return false
        }
      })
    }
  }
}
</script>
