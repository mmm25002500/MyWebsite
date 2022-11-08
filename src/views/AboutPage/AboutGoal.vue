<template>
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
          ></Card>
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
          name: '加強演算法和資料結構(進行中)',
          engName: 'Strengthen_Algorithm_and_Data_Structure',
          short_content: '我常常都在寫專案，忽略了許多演算法和資料結構，在大學的四年中，我給自己的一個目標就是將資料結構跟演算法學好，從基礎至進階，從簡單至困難，邁向真正電腦科學(Conputer Science)一大步。',
          link: '',
          content: ''
        },
        {
          name: '考上好大學(達成)',
          engName: 'Progress_of_learnings',
          short_content: '由於我國是一個重學歷的國家，有個好的學歷人人稱羨，目前我也只是個普通的高中生，想考個好大學，讓父母驕傲。',
          link: '',
          content: ''
        },
        {
          name: '特殊選才(達成)',
          engName: 'Introduction_TSXC',
          short_content: '由於我本身高中是讀商業類科，對於商業興趣不是太大的我，有著特殊才能的我，想透過特殊選才離開商業類科，進入資工系。',
          link: '',
          content: ''
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
