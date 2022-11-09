<template>
  <!-- <div class="accordion" id="accordionExample"> -->
    <div class="accordion-item">
        <h2 class="accordion-header" :id="`log`+version">
        <button @click="closed = !closed" class="accordion-button " :class="{'collapsed':closed}" type="button" data-bs-toggle="collapse" :data-bs-target="`#log`+tag" aria-expanded="true" :aria-controls="`log`+tag">
          <!-- </div>
            <div v-else> -->
            <!-- 如果 版本號跟設定的對得上的話 -->
            <div v-for="(config_data, key2) in config" :key="key2">
              <!-- 第一筆資料應用最新版 -->
              <div v-if="tag===0">
                <div v-if="key2===0">
                  <div class="badge rounded-pill " :class="`bg-`+config[0].color"> {{ config[0].name}} </div>
                </div>
              </div>
              <!-- 其他筆資料的版本號對得上的話 -->
              <div v-else-if="config_data.name === category">
                <span class="badge rounded-pill " :class="`bg-`+config_data.color"> {{ config_data.name}} </span>
              </div>
            </div>
            &nbsp;v{{ version }} {{ category }} - {{ description }}
        </button>
        </h2>
        <div :id="`log`+tag" class="accordion-collapse collapse" :class="{'collapsed':!closed}" :aria-labelledby="`log`+version" data-bs-parent="#accordionExample">
        <div class="accordion-body">
            <ul>
                <li
                  v-for="(content, key2) in changes"
                  :key="key2"
                  style="color: black"
                  >{{ content }}</li>
            </ul>
            <p class="text-dark">更新時間：{{ date }}</p>
        </div>
        </div>
    </div>
  <!-- </div> -->
</template>

<script>
import setting from '@/assets/data/ChangeLogSetting.json'
export default {
  name: 'ChangeLog',
  props: {
    version: String,
    category: String,
    date: String,
    description: String,
    changes: Array,
    tag: Number
    // log: {
    //   type: Array
    // }
  },
  data () {
    return {
      config: setting,
      closed: true
    }
  }
}
</script>
