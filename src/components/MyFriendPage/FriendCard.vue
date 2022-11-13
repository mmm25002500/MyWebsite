<template>
  <section :id="item.tag" class="main inactive">
    <div class="spotlight">
      <div class="content">
        <header class="major">
          <h2>{{item.name}}</h2>
        </header>
        <p>
          {{item.intro}}
        </p>

        <p></p>
        <ul class="actions">
          <li v-if="item.yt"><a target="_blank" :href="item.yt" class="button">YouTube頻道</a></li>
          <li v-if="item.fb"><a target="_blank" :href="item.fb" class="button">Facebook專頁</a></li>
          <li v-if="item.github"><a target="_blank" :href="item.github" class="button">Github</a></li>
        </ul>
        <ul class="actions">
          <li v-if="item.web"><a target="_blank" :href="item.web" class="button">網站</a></li>
        </ul>
      </div>
      <span class="image"><img :src="item.img" alt=""></span>
    </div>
  </section>
</template>

<script>
export default {
  props: {
    item: Object
  }
}
</script>
