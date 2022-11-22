<template>
  <div>
    <h1>{{ title }}</h1>
    <p v-html="description"></p>

    <!-- <center><h6 style="color:red;">看一下廣告支持一下我拉XD (๑•́ ₃ •̀๑)</h6></center> -->

    <!-- 顯示首頁區塊 -->
    <div id="main">

      <About></About>
      <hr class="text-dark">
      <Goal></Goal>
      <hr class="text-dark">
      <!-- <Work></Work>
      <hr class="text-dark">
      <Friends></Friends>
      <hr class="text-dark">
      <Team></Team> -->

    </div>

    <!-- 顯示圓框框外部連結 -->
    <footer id="footer">
      <ul class="icons home-icon ul-link">
        <template v-for="(item, key) in data" :key="key">
          <li class="li-link">
            <a target="_blank" :href="item.link" class="li-link">
              <font-awesome-icon :icon="item.icon" class="icon alt" style="color: #ffffff;">
                <span class="label">{{ item.name }}</span>
              </font-awesome-icon>
            </a>
          </li>
        </template>
      </ul>
    </footer>
  </div>
</template>

<style>
.ul-link {
  list-style-type: none;
  padding: 0;
}
.li-link {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
home-icon {
  cursor: default;
  list-style: none;
  padding-left: 0;
}
.home-icon li {
  border-radius: 100%;
  box-shadow: inset 0 0 0 1px #ffffff;
  display: inline-block;
  height: 3.25rem;
  line-height: 3.5rem;
  text-align: center;
  width: 3.25rem;
  font-size: 16pt;
}
#footer {
    -moz-transition: -moz-transform 0.325s ease-in-out, -moz-filter 0.325s ease-in-out, opacity 0.325s ease-in-out;
    -webkit-transition: -webkit-transform 0.325s ease-in-out, -webkit-filter 0.325s ease-in-out, opacity 0.325s ease-in-out;
    -ms-transition: -ms-transform 0.325s ease-in-out, -ms-filter 0.325s ease-in-out, opacity 0.325s ease-in-out;
    transition: transform 0.325s ease-in-out, filter 0.325s ease-in-out, opacity 0.325s ease-in-out;
    width: 100%;
    max-width: 100%;
    margin-top: 2rem;
    text-align: center;
}
</style>

<script>
import About from '@/components/HomePage/AboutSection.vue'
import Goal from '@/components/HomePage/GoalSection.vue'
// import Work from '@/components/HomePage/WorkSection.vue'
// import Friends from '@/components/HomePage/FriendsSection.vue'
// import Team from '@/components/HomePage/TeamSection.vue'
// import Footer from '@/components/HomePage/FooterSection.vue'

export default {
  components: {
    About,
    Goal
    // Work,
    // Friends,
    // Team,
    // Footer
  },
  data () {
    return {
      title: '夏特稀個人網站',
      // h1: '夏特稀 TershiXia',
      description: '一個正在讀大學的學生<br>為了台灣資訊安全與自己的夢想而努力',
      nav: [
        {
          name: '關於我',
          link: 'about'
        },
        {
          name: '目標',
          link: 'goal'
        },
        {
          name: '作品',
          link: 'work'
        },
        {
          name: '我的好朋友們',
          link: 'friends'
        },
        {
          name: '創立團隊',
          link: 'team'
        }
      ],
      data: [
        {
          name: 'Facebook',
          icon: ['fab', 'facebook'],
          link: 'https://www.facebook.com/TershiXia'
        },
        {
          name: 'Instagram',
          icon: ['fab', 'instagram'],
          link: 'https://www.instagram.com/TershiXia/'
        },
        {
          name: 'GitHub',
          icon: ['fab', 'github'],
          link: 'https://github.com/mmm25002500'
        },
        {
          name: 'YouTube',
          icon: ['fab', 'youtube'],
          link: 'https://www.youtube.com/@TershiXia'
        },
        {
          name: 'Telegram',
          icon: ['fab', 'telegram'],
          link: 'https://t.me/TershiXia'
        },
        {
          name: 'Discord',
          icon: ['fab', 'discord'],
          link: 'https://discordapp.com/users/508266434091155467'
        }
      ]
    }
  }
}
</script>
