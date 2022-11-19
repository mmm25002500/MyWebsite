<template>
  <div>
    <div class="col d-flex justify-content-center">
      <div class="card text-white bg-transparent border-warning" :style="card_style" :id="videoid">
        <div class="card-body">

          <div class="d-flex justify-content-center">
            <!-- 處理圖片，把「外框顏色、長高度、圖片位置」傳進來 -->
            <img
              class="circle-yt"
              :style="`background-image: url('`+img+`');border: 5px solid rgb(0 248 82); width: 300px; height: 150px;`">
          </div>
          <!-- 處理卡片文字，點下去用 emit 回傳 cacheSearch = name 進而展開 -->
          <h5 class="card-title text-info text-center" @click.prevent="returnCacheSearch()">
              {{ title }}
          </h5>
          <h6 class="card-subtitle mb-2 text-muted text-center">{{ channelTitle }}</h6>
          <p class="card-text text-white text-center">
            {{ description }}
          </p>

          <div class="btn-group d-grid gap-2 d-md-block text-center">
            <a
              v-if="videoid"
              :href="`https://www.youtube.com/watch?v=`+videoid"
              target="_blank"
              class="btn btn-danger"
              style="width: 100%;"
              >連結</a>
          </div>

        </div>
      </div>
      <hr>
      </div>
    </div>
</template>

<script>
export default {
  props: {
    title: String,
    videoid: String,
    description: String,
    publishTime: String,
    img: String,
    channelTitle: String,
    card_style: String
  },
  methods: {
    // 點下去用 emit 回傳 cacheSearch = name 進而展開
    returnCacheSearch () {
      window.scrollTo(0, 0)
      this.$emit('cache-search', this.videoid)
    }
  }
}
</script>

<style>
/* 處理圖片的 css */
.circle-yt {
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
    border-radius: 3%;
    box-shadow: inset 0px 0rem 1rem 2px rgb(0 0 0 / 18%) !important;
    background-clip: content-box;
    /* padding: 1px; */
    /* margin: 1em auto; */
    /* border: 2px solid #00fffe; */
}
p {
  text-align: justify;
}
</style>
