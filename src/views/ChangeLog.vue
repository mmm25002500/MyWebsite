<template>
  <div>
    <h1>夏特稀個人網站 - 更新日誌</h1>

    <!-- 處理版本按鈕的部分 -->
    <div class="btn-group" role="group" aria-label="Basic radio toggle button group mb-3">

      <!-- 按下全部，則 cacheSearch 為空 -->
      <div class="mb-3">
        <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off" @click="change('')" checked>
        <label class="btn btn-outline-info text-white" for="btnradio2">全部</label>
      </div>

      <!-- 按下其他按鈕，則 cacheSearch 為該按鈕的名字 -->
      <div v-for="(item, key) in config" :key="key" class="mb-3">
        <!-- 排除第零個值，即「最新版」 -->
        <div v-if="key != 0">
          <input :href="`#`+item.name" type="radio" class="btn-check" name="btnradio" :id="item.name" autocomplete="off" @click="change(item.name)">
          <label class="btn btn-outline-info text-white" :for="item.name">{{ item.name }}</label>
        </div>
      </div>
    </div>

    <!-- 摺疊面板 -->
    <div class="accordion" id="accordionExample">
      <ChangeLog
        v-for="(item, key) in searchData"
        :key="key"
        :version="item.version"
        :category="item.category"
        :date="item.date"
        :description="item.description"
        :changes="item.changes"
        :tag="key"
      ></ChangeLog>
      <!-- <ChangeLog :log="log"></ChangeLog> -->
    </div>
  </div>
</template>

<script>
import json from '../assets/data/ChangeLog.json'
import ChangeLog from '../components/ChangeLog.vue'
import config from '../assets/data/ChangeLogSetting.json'

export default {
  name: 'WebsiteChangeLog',
  components: {
    ChangeLog
  },
  data () {
    return {
      cacheSearch: '',
      config: config,
      searchData: [],
      log: json
    }
  },
  watch: {
    cacheSearch: function (val) {
      this.searchData = this.log.filter((item) => {
        // 如果沒有搜尋到 name
        if (item.category.includes(this.cacheSearch)) {
          return item.category.includes(this.cacheSearch)
        } else {
          return false
        }
      })
    }
  },
  created () {
    this.searchData = this.log
  },
  methods: {
    change (name) {
      this.cacheSearch = name
    }
  }
}
</script>
