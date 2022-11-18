<template>
  <div>
    <h1>我的專案</h1>
    <p>尚未完成！</p>
    <table class="table table-dark table-striped">
      <thead>
        <tr>
          <td>項目</td>
          <td>介紹</td>
          <td>連結</td>
          <td>開源</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, key) in data" :key="key">
          <td v-if="item.link">{{ item.name }}</td>
          <td v-if="item.link">{{ item.description }}</td>
          <td v-if="item.link">
            <a :href="item.link" target="_blank">GOGO</a>
          </td>
          <td v-if="item.link">
            <a :href="item.opensource_link" target="_blank" v-if="item.opensource_link">GOGO</a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  data () {
    return {
      data: [
        {
          name: '國立臺中科技大學課表(大改)',
          link: 'https://nutc.tershi.com',
          opensource_link: 'https://github.com/Cutespirit-Team/Nutc-class-timetable',
          description: 'The timetable'
        },
        {
          name: '靈萌團隊 Discord 機器人',
          link: 'https://dcbot.tershi.com/',
          opensource_link: 'https://github.com/Cutespirit-Team/CutespiritDiscordBot',
          description: '一個由靈萌團隊製作的 DISCORD 機器人，具有各種功能集合，在聊天時更能化解尷尬，將伺服器管理變得更容易。'
        },
        {
          name: '夏特稀個人網站',
          link: 'https://tershi.com',
          opensource_link: 'https://github.com/mmm25002500/MyWebsite',
          description: '夏特稀官方網站，一個使用 vue cli 框架建構的網站。'
        },
        {
          name: '',
          link: '',
          opensource_link: '',
          description: ''
        },
        {
          name: '',
          link: '',
          opensource_link: '',
          description: ''
        },
        {
          name: '',
          link: '',
          opensource_link: '',
          description: ''
        },
        {
          name: '',
          link: '',
          opensource_link: '',
          description: ''
        },
        {
          name: '',
          link: '',
          opensource_link: '',
          description: ''
        },
        {
          name: '',
          link: '',
          opensource_link: '',
          description: ''
        },
        {
          name: '',
          link: '',
          opensource_link: '',
          description: ''
        }
      ]
    }
  }
}
</script>
