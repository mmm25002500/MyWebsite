<template>
  <div id="wrapper">

  <!-- Header -->
    <header id="header">
      <h1>選單</h1>
      <p>可以連結到跟這個網站有關的其他網站喔</p>
    </header>
  <!-- Main -->

  <!-- Nav -->
    <nav id="nav">
      <ul>
        <li><a @click.prevent="anchor('Internal_Link')" class="active" >站內連結</a></li>
        <li><a @click.prevent="anchor('External_Link')" >站外連結</a></li>
      </ul>
    </nav>

    <div id="main">

      <Table v-for="(item, key) in link" :key="key" :data="item"></Table>
    </div>

  <!-- Footer -->
    <footer id="footer">
      <p class="copyright">&copy; Cutespirit {{ new Date().getFullYear() }}.</p>
    </footer>

  </div>
</template>

<script>
import Table from '@/components/MenuPage/MenuSection.vue'

export default {
  components: {
    Table
  },
  data () {
    return {
      link: [
        {
          id: 'Internal_Link',
          name: '站內連結 Internal Link',
          link_list: [
            [
              {
                name: '首頁',
                url: '/index.html',
                available: true
              },
              {
                name: '舊版首頁',
                url: '/oldSite/index.html',
                available: true
              }
            ],
            [
              {
                name: '夏特稀直播間',
                url: '/live.html',
                available: true
              },
              {
                name: '靈萌搜尋引擎',
                url: 'https://search.cutespirit.org',
                available: false
              }
            ],
            [
              {
                name: '申請加入團隊',
                url: '/signup.html',
                available: true
              },
              {
                name: '意見回饋',
                url: '/feedback.html',
                available: true
              }
            ],
            [
              {
                name: '特殊選才專區',
                url: '/goal/特殊選才.php',
                available: true
              },
              {
                name: '',
                url: '',
                available: false
              }
            ],
            [
              {
                name: '',
                url: '',
                available: false
              },
              {
                name: '',
                url: '',
                available: false
              }
            ]
          ]
        },
        {
          id: 'External_Link',
          name: '站外連結 External Link',
          link_list: [
            [
              {
                name: '夏特稀YouTube',
                url: 'https://youtube.com/夏特稀',
                available: true
              },
              {
                name: '夏特稀Github',
                url: 'https://github.com/mmm25002500',
                available: true
              }
            ],
            [
              {
                name: '夏特稀Facebook專頁',
                url: 'https://www.facebook.com/Tershi25648',
                available: true
              },
              {
                name: '夏特稀(愛神閃靈) Google Play商店開發者',
                url: 'https://play.google.com/store/apps/dev?id=6147587781200868109',
                available: true
              }
            ],
            [
              {
                name: '靈萌郵件伺服器',
                url: 'https://mail.cutespirit.org',
                available: false
              },
              {
                name: '靈萌官網',
                url: 'https://team.tershi.com',
                available: true
              }
            ],
            [
              {
                name: '靈萌商店',
                url: 'https://shop.cutespirit.org',
                available: false
              },
              {
                name: '靈萌團隊Facebook專頁',
                url: 'https://www.facebook.com/cutespirit05428',
                available: true
              }
            ],
            [
              {
                name: '夏特稀部落格',
                url: 'https://blog.tershi.com',
                available: true
              },
              {
                name: '',
                url: '',
                available: false
              }
            ],
            [
              {
                name: '',
                url: '',
                available: false
              },
              {
                name: '',
                url: '',
                available: false
              }
            ],
            [
              {
                name: '',
                url: '',
                available: false
              },
              {
                name: '',
                url: '',
                available: false
              }
            ],
            [
              {
                name: '',
                url: '',
                available: false
              },
              {
                name: '',
                url: '',
                available: false
              }
            ]
          ]
        }
      ]
    }
  },
  methods: {
    anchor (anchorName) {
      const anchorElement = document.getElementById(anchorName)
      if (anchorElement) {
        anchorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }
}
</script>
