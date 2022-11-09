<template>
  <hr>
  <div class="card text-white bg-transparent border-warning" :id="tag" >
    <div class="card-body">
      <h5 class="card-title">
        <span class="badge rounded-pill " :class="`text-bg-`+badge_config[badge]" v-if="badge">{{ badge }}</span>
        {{ title }}
      </h5>
      <h6 class="card-subtitle mb-2 text-muted">{{ short }}</h6>
      <p class="card-text" v-html="content"></p>

      <p v-if="date">時間: {{ date }}</p>
      <!-- 跳出彈跳視窗，把 content搞進去 -->
      <Modal
        v-if="isMore"
        :title="title"
        :tag="tag"
        :content="content"
        :date="date"
        :badge="badge"
        :badge_config="badge_config"
      ></Modal>
      <!-- <button class="btn btn-primary">
        查看更多(尚未完成)
      </button> -->
    </div>
  </div>
</template>

<script>
import Modal from '@/components/AboutPage/ModalMore.vue'
export default {
  components: {
    Modal
  },
  props: {
    title: String,
    tag: String,
    short: String,
    content: String,
    date: String,
    badge: String,
    badge_config: Object,
    isMore: Boolean
  }
}
</script>
