<template>
  <section :id="data.id" class="main">
    <h3>{{ data.name }}</h3>
    <div class="table-wrapper">
      <table class="alt">
        <thead>
          <tr>
            <th>名字 Name</th>
            <th>敘述 Description</th>
            <th>名字 Name</th>
            <th>敘述 Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, key) in data.link_list" :key="key">
            <template v-for="(item2, key2) in item" :key="key2">
              <td v-if="item2.name">
                <!-- <div class="bootstrap-iso"> -->
                  <div class="bs-5" v-if="!item2.available">
                    <span class="badge text-bg-danger">不可用</span>
                    {{item2.name}}
                  </div>
                  <div class="bs-5" v-else>
                    <span class="badge text-bg-success">可用</span>
                    {{item2.name}}
                  </div>
                <!-- </div> -->
              </td>
              <td v-if="item2.url"><a target="_blank" :href="item2.url">GOGO</a></td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      required: true
    }
  }
}
</script>
