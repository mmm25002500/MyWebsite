<template>
  <div>
    <h1>聯絡夏特稀</h1>
    <table class="table table-dark table-striped">
      <thead>
        <tr>
          <td>項目</td>
          <td>連結</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, key) in data" :key="key">
          <td>{{ item.name }}</td>
          <td><a :href="item.link">{{ item.link_name }}</a></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import data from '@/assets/data/ContentMe.json'
export default {
  name: 'ContactMe',
  data () {
    return {
      data: data
    }
  }
}
</script>
