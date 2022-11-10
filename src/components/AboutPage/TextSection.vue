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
      <div v-if="!link">
        <Modal
          v-if="isMore"
          :title="title"
          :tag="tag"
          :content="content"
          :more_content="more_content"
          :date="date"
          :badge="badge"
          :badge_config="badge_config"
        ></Modal>
      </div>
      <div v-else>
        <router-link :to="`/about/goal/`+eng_name" type="button" class="btn btn-outline-warning" href="#">
          查看更多
        </router-link>

        <button type="button" class="btn btn-outline-info" >
          分享這段(尚未完成)
        </button>
      </div>
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
    eng_name: String,
    tag: String,
    short: String,
    content: String,
    more_content: Array,
    link: Boolean,
    date: String,
    badge: String,
    badge_config: Object,
    isMore: Boolean
  }
}
</script>
