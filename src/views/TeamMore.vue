<template>
  <div id="wrapper">

  <!-- Header -->
    <header id="header">
      <h1>創立團隊</h1>
      <p>想加入靈萌團隊嗎？跟喜歡資訊&軟體和寫程式的同好們一起努力，共同締造未來</p>
    </header>

  <!-- Nav -->
    <nav id="nav">
      <ul>
        <li v-for="(item, key) in team" :key="key">
          <a :href="`#`+item.id">{{ item.name }}</a>
        </li>
      </ul>
    </nav>

  <!-- Main -->
    <div id="main">
      <!-- Content -->
      <Card v-for="(item, key) in team" :key="key" :team="item"></Card>
    </div>

    <Footer></Footer>
  </div>
</template>

<script>
import Card from '@/components/TeamPage/MoreCard.vue'
import Footer from '@/components/HomePage/FooterSection.vue'
export default {
  components: {
    Card,
    Footer
  },
  data () {
    return {
      team: [
        {
          name: '靈萌團隊',
          id: 'cutespirit',
          description: '創立理念：由於先前有創立團隊的經驗，新的團隊很快就能上手，我們討論了兩天，創立了團隊商店(Cutespirit-SHOP 靈萌商店)',
          img: '/images/team.png',
          link: [
            {
              name: '查看團隊歷史',
              link: ''
            },
            {
              name: '查看團隊介紹',
              link: ''
            },
            {
              name: '查看團隊成員',
              link: ''
            }
          ]
        },
        {
          name: '愛神閃靈團隊',
          id: 'ASSL',
          description: '這裡啥都沒有',
          img: '/images/oldTeam2.png',
          link: [
            {
              name: '查看團隊歷史',
              link: ''
            },
            {
              name: '查看團隊介紹',
              link: ''
            },
            {
              name: '查看團隊成員',
              link: ''
            }
          ]
        },
        {
          name: '團隊歷史',
          id: 'team_history',
          description: '這裡啥都沒有',
          img: '',
          link: [
            {
              name: '查看更多',
              link: ''
            },
            {
              name: '',
              link: ''
            },
            {
              name: '',
              link: ''
            }
          ]
        }
      ]
    }
  }
}
</script>
