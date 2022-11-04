<template>
  <section :id="myself.tag" class="main inactive">
    <div class="spotlight">
      <div class="content">
        <header class="major">
          <h2> {{ myself.name }} {{ myself.EngName }}</h2>
        </header>
        <p v-html="myself.content"></p>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  props: {
    myself: {
      type: Object,
      required: true
    }
  }
}
</script>
