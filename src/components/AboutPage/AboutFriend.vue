<template>

    <div class="col d-flex justify-content-center">
      <div class="card text-white bg-transparent border-warning" :style="style" :id="tag">
        <div class="card-body">
          <div class="d-flex justify-content-center">
            <img :src="img" class="rounded-circle" style="width: 40%" alt="圖片無法顯示呦~ 請確認位置4否正確">
          </div>
          <h5 class="card-title text-info">{{ name }}</h5>
          <h6 class="card-subtitle mb-2 text-muted">{{ nic_name }}</h6>
          <p class="card-text text-white">
            {{ intro }}
          </p>
          <div class="btn-group d-grid gap-2 d-md-block">
            <span v-for="(item, key) in link" :key="key">
              <a
                v-if="item.link"
                :href="item.link"
                target="_blank"
                class="btn "
                :class="`btn-`+item.color"
                :style="item.style"
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
    link: Object,
    style: String
  }
}
</script>
