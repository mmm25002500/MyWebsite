<template>
  <div id="wrapper">

    <!-- Header -->
      <header id="header" class="alt">
        <!--<span class="logo"><img src="images/logo.svg" alt="" /></span> -->
        <!-- <span class="logo"><img src="images/logo.svg" width="85" alt=""></span> -->
        <h1>{{ title }}</h1>
        <p v-html="description"></p>

      </header>
      <!-- <center><h6 style="color:red;">看一下廣告支持一下我拉XD (๑•́ ₃ •̀๑)</h6></center> -->
    <!-- Nav -->
      <!-- <nav id="nav">
        <ul>
          <li v-for="(item, key) in nav" :key="key">
            <a :href="`#`+item.link">{{ item.name }}</a>
          </li>
        </ul>
      </nav> -->
    <!-- Main -->
      <div id="main">

        <About></About>
        <hr class="text-dark">
        <Goal></Goal>
        <hr class="text-dark">
        <Work></Work>
        <hr class="text-dark">
        <Friends></Friends>
        <hr class="text-dark">
        <Team></Team>

      </div>

    <Footer></Footer>

  </div>
</template>

<script>
import About from '@/components/HomePage/AboutSection.vue'
import Goal from '@/components/HomePage/GoalSection.vue'
import Work from '@/components/HomePage/WorkSection.vue'
import Friends from '@/components/HomePage/FriendsSection.vue'
import Team from '@/components/HomePage/TeamSection.vue'
import Footer from '@/components/HomePage/FooterSection.vue'

// const alljs = document.createElement('script')
// alljs.setAttribute('src', '/js/all.js')
// document.head.appendChild(alljs)

// const a1 = document.createElement('script')
// a1.setAttribute('src', '/js/jquery.min.js')
// document.head.appendChild(a1)

// const a2 = document.createElement('script')
// a2.setAttribute('src', '/js/jquery.scrollex.min.js')
// document.head.appendChild(a2)

// const a3 = document.createElement('script')
// a3.setAttribute('src', '/js/jquery.scrolly.min.js')
// document.head.appendChild(a3)

// const a4 = document.createElement('script')
// a4.setAttribute('src', '/js/browser.min.js')
// document.head.appendChild(a4)

// const a5 = document.createElement('script')
// a5.setAttribute('src', '/js/breakpoints.min.js')
// document.head.appendChild(a5)

// const a6 = document.createElement('script')
// a6.setAttribute('src', '/js/util.js')
// document.head.appendChild(a6)

// const a7 = document.createElement('script')
// a7.setAttribute('src', '/js/main.js')
// document.head.appendChild(a7)

export default {
  components: {
    About,
    Goal,
    Work,
    Friends,
    Team,
    Footer
  },
  data () {
    return {
      title: '夏特稀 TershiXia',
      h1: '夏特稀 TershiXia',
      description: '一個正在讀高中的學生<br>為了台灣資訊安全與自己的夢想而努力',
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
      ]
    }
  }
}
</script>
