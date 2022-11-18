<template>

    <div class="col d-flex justify-content-center">
      <div class="card text-white bg-transparent border-warning" :style="card_style" :id="tag">
        <div class="card-body">
          <div class="d-flex justify-content-center">
            <!-- 處理圖片，把「外框顏色、長高度、圖片位置」傳進來 -->
            <img
              class="rounded-circle circle"
              :style="`background-image: url('`+img+`');border: 2px solid `+border_color+`;`+img_style">
          </div>
          <!-- 處理朋友文字，點下去用 emit 回傳 cacheSearch = name 進而展開 -->
          <h5 class="card-title text-info text-center" @click.prevent="returnCacheSearch()">
              {{ name }}
          </h5>
          <h6 class="card-subtitle mb-2 text-muted text-center">{{ nic_name }}</h6>
          <p class="card-text text-white text-center">
            {{ intro }}
          </p>

          <!-- 處理第三方連結按鈕的部分 -->
          <div class="btn-group d-grid gap-2 d-md-block text-center">
            <span v-for="(item, key) in link" :key="key">
              <a
                v-if="item.link"
                :href="item.link"
                target="_blank"
                class="btn "
                :class="`btn-`+item.color"
                :style="item.card_style"
                >{{ item.name }}</a>
            </span>
          </div>
        </div>
      </div>
      <hr>
    </div>

  <!-- <div class="card text-white bg-transparent border-warning" :id="tag" >
    <div class="card-body">
      <h5 class="card-title">
        {{ title }}
      </h5>
      <h6 class="card-subtitle mb-2 text-muted">{{ short }}</h6>
      <p class="card-text" v-html="content"></p>

      <p v-if="date">時間: {{ date }}</p> -->
      <!-- 跳出彈跳視窗，把 content搞進去 -->
      <!-- <button class="btn btn-primary">
        查看更多(尚未完成)
      </button> -->
    <!-- </div> -->
  <!-- </div> -->
</template>

<script>
export default {
  props: {
    name: String,
    nic_name: String,
    intro: String,
    tag: String,
    img: String,
    img_style: String,
    link: Object,
    border_color: String,
    card_style: String
  },
  methods: {
    // 點下去用 emit 回傳 cacheSearch = name 進而展開
    returnCacheSearch () {
      window.scrollTo(0, 0)
      this.$emit('cache-search', this.tag)
    }
  }
}
</script>

<style>
/* 處理圖片的 css */
.circle {
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
    border-radius: 50%;
    box-shadow: inset 0px 0rem 1rem 2px rgb(0 0 0 / 18%) !important;
    background-clip: content-box;
    /* padding: 1px; */
    /* margin: 1em auto; */
    /* border: 2px solid #00fffe; */
}
</style>
