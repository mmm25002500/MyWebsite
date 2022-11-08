<template>
  <div class="accordion" id="accordionExample">
    <div class="accordion-item" v-for="(item, key) in log" :key="key">
        <h2 class="accordion-header" :id="`log`+item.version">
        <button @click="item.closed = !item.closed" class="accordion-button " :class="{'collapsed':item.closed}" type="button" data-bs-toggle="collapse" :data-bs-target="`#log`+key" aria-expanded="true" :aria-controls="`log`+key">
          <!-- </div>
            <div v-else> -->
            <!-- 如果 版本號跟設定的對得上的話 -->
            <div v-for="(config_data, key2) in config" :key="key2">
              <!-- 第一筆資料應用最新版 -->
              <div v-if="key===0">
                <div v-if="key2===0">
                  <div class="badge rounded-pill " :class="`bg-`+config[0].color"> {{ config[0].name}} </div>
                </div>
              </div>
              <!-- 其他筆資料的版本號對得上的話 -->
              <div v-else-if="config_data.name === item.category">
                <span class="badge rounded-pill " :class="`bg-`+config_data.color"> {{ config_data.name}} </span>
              </div>
            </div>
            &nbsp;v{{ item.version }} {{ item.category }} - {{ item.description }}
        </button>
        </h2>
        <div :id="`log`+key" class="accordion-collapse collapse" :class="{'collapsed':!item.closed}" :aria-labelledby="`log`+item.version" data-bs-parent="#accordionExample">
        <div class="accordion-body">
            <ul>
                <li
                  v-for="(content, key2) in item.changes"
                  :key="key2"
                  style="color: black"
                  >{{ content }}</li>
            </ul>
            <p class="text-dark">更新時間：{{ item.date }}</p>
        </div>
        </div>
    </div>
  </div>
</template>

<script>
import setting from '@/assets/data/ChangeLogSetting.json'
export default {
  name: 'ChangeLog',
  props: {
    log: {
      type: Array
    }
  },
  data () {
    return {
      config: setting
    }
  }
}
</script>
