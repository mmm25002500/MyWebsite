<template>
  <hr>
  <div class="card text-white bg-transparent border-warning" :id="tag" >
    <div class="card-body">
      <h5 class="card-title">{{ title }}</h5>
      <h6 class="card-subtitle mb-2 text-muted">{{ short }}</h6>
      <p class="card-text" v-html="content"></p>

      <!-- 跳出彈跳視窗，把 content搞進去 -->
      <button class="btn btn-primary">
        查看更多(尚未完成)
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    tag: String,
    short: String,
    content: String
  }
}
</script>
