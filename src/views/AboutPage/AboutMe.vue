<template>
  <div>

    <!-- Header -->
    <header id="header">
      <h1>About Me</h1>
      <p>大家好，我是夏特稀，我是一名高中生，喜歡在課餘時候研究程式語言相關的東西。</p>
    </header>

    <!-- 搜尋 -->
    <div class="form-floating text-dark mb-3">
      <textarea class="form-control" placeholder="搜尋條目" id="searchDeveloper" v-model="cacheSearch"></textarea>
      <label for="searchDeveloper">搜尋條目</label>
    </div>

    <!-- 顯示「全部」按鈕 -->
    <button type="button" class="d-flex p-2 btn btn-outline-warning text-white" data-bs-toggle="offcanvas" data-bs-target="#offcanvasExample" aria-controls="offcanvasExample">
      查看全部
    </button>
    <div class="btn-group" role="group" aria-label="Basic radio toggle button group mb-3">
      <div class="mb-3">
        <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off" @click="change('')" checked>
        <label class="btn btn-outline-info text-white" for="btnradio2">全部</label>
      </div>

      <!-- 顯示條目按鈕 -->
      <div v-for="(item, key) in data" :key="key" class="mb-3">
        <input :href="`#`+item.id" type="radio" class="btn-check" name="btnradio" :id="item.id" autocomplete="off" @click="change(item.id)">
        <label class="btn btn-outline-info text-white" :for="item.id">{{ item.title }}</label>
      </div>
    </div>

    <!-- 如果只有一個，那就滿版 -->
    <div v-if="searchData.length === 1
">
      <Card
        v-for="(item, key) in searchData"
        :key="key"
        :title="item.title"
        :eng_name="item.id"
        :tag="item.id"
        :short="item.id"
        :content="item.description"
        :isMore="true"
        :link="true"
        more_link="/about/me/"
        >
      </Card>
    </div>
    <!-- 如果兩個以上，就分割成兩欄 -->
    <div v-else>
        <div class="row row-cols-1 g-4 row-cols-md-2">
          <div class="col" v-for="(item, key) in searchData" :key="key">
            <Card
              :title="item.title"
              :eng_name="item.id"
              :tag="item.id"
              :short="item.id"
              :content="item.description"
              :isMore="true"
              :link="true"
              more_link="/about/me/"
            ></Card>
          </div>
        </div>
    </div>
  </div>
  <Sidebar name="這是關於我的頁面喔~" content="點點看吧，可以展開喔" :data="data" @cache-search="getReturnData"></Sidebar>
</template>

<script>
import Card from '@/components/AboutPage/TextSection.vue'
import data from '@/assets/data/AboutMe.json'
// import Modal from '@/components/AboutPage/ModalMore.vue'
import Sidebar from '@/components/SidebarSection.vue'

export default {
  components: {
    Card,
    Sidebar
    // Modal
  },
  data () {
    return {
      cacheSearch: '',
      searchData: [],
      data: data
    }
  },
  watch: {

    // 自製搜尋算法
    cacheSearch: function (val) {
      this.searchData = this.data.filter((item) => {
        // 如果沒有搜尋到 name
        if (item.id.includes(this.cacheSearch)) {
          return item.id.includes(this.cacheSearch)
        } else if (item.title.includes(this.cacheSearch)) {
          return item.title.includes(this.cacheSearch)
        } else if (item.date.includes(this.cacheSearch)) {
          return item.date.includes(this.cacheSearch)
        } else if (item.description.includes(this.cacheSearch)) {
          return item.description.includes(this.cacheSearch)
        } else {
          return false
        }
      })
    }
  },
  created () {
    // 載入資料
    this.searchData = this.data
  },
  methods: {
    change (name) {
      this.cacheSearch = name
    },
    getReturnData (data) {
      this.cacheSearch = data
    }
  }
}
</script>
