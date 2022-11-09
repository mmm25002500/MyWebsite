<template>
  <div>
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
        <input :href="`#`+item.name" type="radio" class="btn-check" name="btnradio" :id="item.name" autocomplete="off" @click="change(item.engName)">
        <label class="btn btn-outline-info text-white" :for="item.name">{{ item.name }}</label>
      </div>
    </div>

    <!-- 如果只有一個，那就滿版 -->
    <div v-if="searchData.length === 1">
      <Card
        v-for="(item, key) in searchData"
        :key="key"
        :title="item.name"
        :tag="item.engName"
        :short="item.engName"
        :content="item.short_content"
        :date="item.date"
        :badge="item.achieve"
        :badge_config="badge_config"
        :isMore="item.isMore"
        >
      </Card>
    </div>
    <!-- 如果兩個以上，就分割成兩欄 -->
    <div v-else>
        <div class="row row-cols-1 g-4 row-cols-md-2">
          <div class="col" v-for="(item, key) in searchData" :key="key">
            <Card
              :title="item.name"
              :tag="item.engName"
              :short="item.engName"
              :content="item.short_content"
              :date="item.date"
              :badge="item.achieve"
              :badge_config="badge_config"
              :isMore="item.isMore"
            ></Card>
          </div>
        </div>
    </div>
  </div>
</template>

<script>
import Card from '@/components/AboutPage/TextSection.vue'
import data from '@/assets/data/AboutGoal.json'

export default {
  components: {
    Card
  },
  data () {
    return {
      cacheSearch: '',
      searchData: [],
      badge_config: {
        已達成: 'success',
        進行中: 'primary',
        未達成: 'danger'
      },
      data: data
    }
  },
  watch: {
    cacheSearch: function (val) {
      this.searchData = this.data.filter((item) => {
        // 如果沒有搜尋到 name
        if (item.name.includes(this.cacheSearch)) {
          return item.name.includes(this.cacheSearch)
        } else if (item.engName.includes(this.cacheSearch)) {
          return item.engName.includes(this.cacheSearch)
        } else if (item.short_content.includes(this.cacheSearch)) {
          return item.short_content.includes(this.cacheSearch)
        } else if (item.content.includes(this.cacheSearch)) {
          return item.content.includes(this.cacheSearch)
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
