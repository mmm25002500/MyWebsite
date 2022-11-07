<template>
  <h1>夏特稀個人網站 - 更新日誌</h1>
  <ChangeLog :log="log"></ChangeLog>
</template>

<script>
import json from '../assets/data/ChangeLog.json'
import ChangeLog from '../components/ChangeLog.vue'
export default {
  name: 'WebsiteChangeLog',
  components: {
    ChangeLog
  },
  data () {
    return {
      log: json
    }
  }
}
</script>
