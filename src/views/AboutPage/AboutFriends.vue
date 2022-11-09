<template>
  <div>
    <!-- Header -->
    <header id="header">
      <h1>夏特稀的好朋友</h1>
      <p>這裡記錄著我跟我的朋友的點點滴滴和關係</p>
    </header>
    <div class="form-floating text-dark mb-3">
      <textarea class="form-control" placeholder="搜尋夏特稀的捧由ㄅ!" id="searchDeveloper" v-model="cacheSearch"></textarea>
      <label for="searchDeveloper">搜尋夏特稀的捧由ㄅ!</label>
    </div>
    <div class="btn-group" role="group" aria-label="Basic radio toggle button group mb-3">
      <div class="mb-3">
        <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off" @click="change('')" checked>
        <label class="btn btn-outline-info text-white" for="btnradio2">全部</label>
      </div>
      <div v-for="(item, key) in friendData" :key="key" class="mb-3">
        <input :href="`#`+item.name" type="radio" class="btn-check" name="btnradio" :id="item.name" autocomplete="off" @click="change(item.name)">
        <label class="btn btn-outline-info text-white" :for="item.name">{{ item.name }}</label>
      </div>
    </div>

    <div class="row row-cols-1 g-4 row-cols-md-3" v-if="searchData.length != 1">
      <Card
        v-for="(item, key) in searchData"
        :key="key"
        :name="item.name"
        :nic_name="item.nic_name"
        :intro="item.intro"
        :tag="item.tag"
        :img="item.img"
        :link="item.link"
        style="width: 18rem;"
        ></Card>
    </div>
    <div v-else>
      <Card
        v-for="(item, key) in searchData"
        :key="key"
        :name="item.name"
        :nic_name="item.nic_name"
        :intro="item.intro"
        :tag="item.tag"
        :img="item.img"
        :link="item.link"
        style="width: 100%;"
        ></Card>
    </div>
  </div>
</template>

<script>
import Card from '@/components/AboutPage/AboutFriend.vue'
export default {
  components: {
    Card
  },
  data () {
    return {
      cacheSearch: '',
      friendData: [
        {
          name: 'CuteUSB',
          nic_name: '萌弟',
          tag: 'CuteUSB',
          img: 'images/CuteUSB.jpg',
          intro: 'NULL',
          link: [
            {
              name: 'Facebook',
              link: 'https://www.facebook.com/ChanelOscar929',
              color: 'primary'
            },
            {
              name: 'Instagram',
              link: '',
              color: 'danger',
              style: 'background-color: #d63384'
            },
            {
              name: 'Github',
              link: 'https://github.com/cskevinc',
              color: 'dark'
            },
            {
              name: 'YouTube',
              link: 'https://youtube.com/CuteUSB',
              color: 'danger'
            },
            {
              name: 'Website',
              link: '',
              color: 'primary'
            }
          ]
        },
        {
          name: '哈密瓜',
          nic_name: 'y1220asdf',
          tag: 'hamigua',
          img: 'https://yt3.ggpht.com/fDFu82cgxhrpx00xLlUz-hIJbJRM9i-StKqKOIn_BOKIF1YzMJGKmdqT7p-zdyHf4B5_bCFNog=s176-c-k-c0x00ffffff-no-rj-mo',
          intro: '人不錯',
          link: [
            {
              name: 'Facebook',
              link: '',
              color: 'primary'
            },
            {
              name: 'Instagram',
              link: '',
              color: 'danger',
              style: 'background-color: #d63384'
            },
            {
              name: 'Github',
              link: 'https://github.com/y1220asdf',
              color: 'dark'
            },
            {
              name: 'YouTube',
              link: 'https://youtube.com/哈密瓜',
              color: 'danger'
            },
            {
              name: 'Website',
              link: 'https://hamigua.cutespirit.org/',
              color: 'primary'
            }
          ]
        },
        {
          name: '凜月',
          nic_name: 'NingYue',
          tag: 'NingYue',
          img: 'https://cdn.discordapp.com/avatars/983627634284048474/343bc24e156e1526aedefa7ccd46bfb9.webp?size=128',
          intro: '一個好人',
          link: [
            {
              name: 'Facebook',
              link: '',
              color: 'primary'
            },
            {
              name: 'Instagram',
              link: '',
              color: 'danger',
              style: 'background-color: #d63384'
            },
            {
              name: 'Github',
              link: '',
              color: 'dark'
            },
            {
              name: 'YouTube',
              link: '',
              color: 'danger'
            },
            {
              name: 'Website',
              link: '',
              color: 'primary'
            }
          ]
        }
      ],
      searchData: []
    }
  },
  created () {
    this.searchData = this.friendData
  },
  watch: {
    cacheSearch: function (val) {
      this.searchData = this.friendData.filter((item) => {
        // 如果沒有搜尋到 name
        if (item.name.includes(this.cacheSearch)) {
          return item.name.includes(this.cacheSearch)
        } else if (item.tag.includes(this.cacheSearch)) {
          return item.tag.includes(this.cacheSearch)
        } else if (item.intro.includes(this.cacheSearch)) {
          return item.intro.includes(this.cacheSearch)
        } else if (item.nic_name.includes(this.cacheSearch)) {
          return item.nic_name.includes(this.cacheSearch)
        } else {
          return false
        }
      })
    }
  },
  methods: {
    change (name) {
      this.cacheSearch = name
    }
  }
}
</script>
