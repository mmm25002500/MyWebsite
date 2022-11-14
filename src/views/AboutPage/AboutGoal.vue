<template>
  <div>
    <h2>我的目標 {{txt}}</h2>
    <p>這裡是我在人生的階段想做的事和已經做完的事，在這裡紀錄，為了實現夢想，正在朝著我的目標而前進。</p>

    <!-- 搜尋 -->
    <div class="form-floating text-dark mb-3">
      <textarea class="form-control" placeholder="搜尋條目" id="searchDeveloper" v-model="cacheSearch"></textarea>
      <label for="searchDeveloper">搜尋條目</label>
    </div>

    <!-- 顯示「全部」按鈕 -->
    <div class="btn-group" role="group" aria-label="Basic radio toggle button group mb-3">
      <div class="mb-3">
        <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off" @click="change('')" checked>
        <label class="btn btn-outline-info text-white" for="btnradio2">全部</label>
      </div>

      <!-- 顯示目標按鈕 -->
      <div v-for="(item, key) in entries" :key="key" class="mb-3">
        <input :href="`#`+item.title" type="radio" class="btn-check" name="btnradio" :id="item.id" autocomplete="off" @click="change(item.id)">
        <label class="btn btn-outline-info text-white" :for="item.id">{{ item.title }}</label>
      </div>
    </div>

    <!-- 如果只有一個，那就滿版 -->
    <div v-if="searchData.length === 1">
      <Card
        v-for="(entry, key) in searchData"
        :key="key"
        :title="entry.title"
        :eng_name="entry.id"
        :tag="entry.id"
        :short="entry.id"
        :content="entry.description"
        :more_content="entry.content"
        more_link="/about/goal/"
        :date="entry.date"
        :badge="entry.achieve"
        :badge_config="badge_config"
        :link="true"
        >
      </Card>
    </div>
    <!-- 如果兩個以上，就分割成兩欄 -->
    <div v-else>
        <div class="row row-cols-1 g-4 row-cols-md-2">
          <div class="col" v-for="(entry, key) in searchData" :key="key">
              <Card
                :title="entry.title"
                :eng_name="entry.id"
                :tag="entry.id"
                :short="entry.id"
                :content="entry.description"
                :more_content="entry.content"
                more_link="/about/goal/"
                :date="entry.date"
                :badge="entry.achieve"
                :badge_config="badge_config"
                :link="true"
              ></Card>
          </div>
        </div>
    </div>

  </div>
</template>

<script>
import Card from '@/components/AboutPage/TextSection.vue'
import data from '@/assets/data/AboutGoal.json'
// import helloworld from `raw-loader!@/assets/goal/hi.md`

export default {
  components: {
    Card
  },
  data () {
    return {
      // txt: helloworld,
      name: 'hi.md',
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

    // 自製搜尋算法
    cacheSearch: function (val) {
      this.searchData = this.data.filter((item) => {
        // 如果沒有搜尋到 name
        if (item.id.includes(this.cacheSearch)) {
          return item.id.includes(this.cacheSearch)
        } else if (item.title.includes(this.cacheSearch)) {
          return item.title.includes(this.cacheSearch)
        } else if (item.description.includes(this.cacheSearch)) {
          return item.description.includes(this.cacheSearch)
        } else if (item.achieve.includes(this.cacheSearch)) {
          return item.achieve.includes(this.cacheSearch)
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
  },
  computed: {

    // 獲取所有條目
    entries () {
      return data
    }
  }
}
</script>
