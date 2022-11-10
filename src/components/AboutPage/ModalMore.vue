<template>
  <div class="text-dark">
    <!-- Button trigger modal -->
    <button type="button" class="btn btn-outline-warning" data-bs-toggle="modal" :data-bs-target="`#Modal`+tag">
      查看更多
    </button>

    <button type="button" class="btn btn-outline-info" >
      分享這段(尚未完成)
    </button>

    <!-- Modal -->
    <div class="modal fade" :id="`Modal`+tag" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="exampleModalLabel">{{ title }}</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-for="(item, key) in more_content" :key="key">
              <p v-html="item.content"></p>
              <hr>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
            <!-- <button type="button" class="btn btn-primary">Save changes</button> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    tag: String,
    content: String,
    more_content: Array,
    date: String,
    badge: String,
    badge_config: Object
  }
}
</script>
