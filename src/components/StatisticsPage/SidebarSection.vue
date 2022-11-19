<template>
  <!-- 改為 ref 去展開 -->
  <div>
    <button type="button" class="d-flex p-2 btn btn-outline-warning text-white" data-bs-toggle="offcanvas" data-bs-target="#offcanvasExample" aria-controls="offcanvasExample">
        查看全部
    </button>
    <div class="offcanvas offcanvas-start text-dark" tabindex="-1" id="offcanvasExample" aria-labelledby="offcanvasExampleLabel">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title" id="offcanvasExampleLabel">{{ name }}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div class="offcanvas-body">
        <div>
          {{ content }}
        </div>
        <div v-for="(item, key) in data" :key="key">
          <a type="button" @click.prevent="returnCacheSearch(item.id.videoId)" class="d-flex p-2 btn btn-outline-danger" >
            {{ item.snippet.title }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    name: String,
    content: String,
    data: Object
  },
  methods: {
    // 點下去用 emit 回傳 cacheSearch = name 進而展開
    returnCacheSearch (tag) {
      this.$emit('cache-search', tag)
    }
  }
}
</script>
