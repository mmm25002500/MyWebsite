<template>
  <section :id="team.id" class="main inactive">
    <div class="spotlight">
      <div class="content">
        <header class="major">
          <h2>{{ team.name }}</h2>
        </header>
        <p>{{ team.description }}</p>
        <ul class="actions">
          <li v-for="(item, key) in team.link" :key="key">
            <a
              target="_blank"
              :href="item.link"
              class="button"
              v-if="item.link"
              >{{ item.name }}
            </a>
          </li>
        </ul>
      </div>
      <span class="image">
        <img v-if="team.img" :src="team.img" alt="">
      </span>
    </div>
  </section>
</template>

<script>
export default {
  props: {
    team: {
      type: Object,
      required: true
    }
  }
}
</script>
