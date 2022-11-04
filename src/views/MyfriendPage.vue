<template>
  <div id="wrapper">

  <!-- Header -->
    <header id="header">
      <h1>夏特稀的好朋友</h1>
      <p>這裡記錄著我跟我的朋友的點點滴滴和關係</p>
    </header>

    <nav id="nav">
      <ul>
        <li v-for="(item, key) in searchData" :key="key">
          <a :href="`#`+item.tag">
            {{item.name}}
          </a>
        </li>
      </ul>
    </nav>

  <!-- Main -->
    <div id="main">
      <div class="form-floating mb-2">
        <input type="text" class="form-control" id="search" placeholder="搜尋夏特稀的捧由ㄅ!" v-model="cacheSearch">
        <div v-if="cacheSearch">
          有 {{ searchData.length }} 個符合搜尋結果 <br>
          尋找到:
          <div v-if="cacheSearch">
            <template v-for="(item, key) in searchData" :key="key">
              <template v-if="key+1 === searchData.length">
                <a :href="`#`+item.name">{{ item.name }}</a>
              </template>
              <template v-else>
              <a :href="`#`+item.name">{{ item.name }}</a>、
              </template>
            </template>
          </div>
          <br>
          <button @click="cacheSearch=''">清除搜尋</button>
        </div>
      </div>
      <Card  v-for="(item, key) in searchData" :key="key" :item="item"></Card>
    </div>

  <!-- Footer -->
    <footer id="footer">
      <p class="copyright">&copy; Cutespirit {{ new Date().getFullYear() }}.</p>
    </footer>

  </div>
</template>

<script>
import Card from '@/components/MyFriendPage/FriendCard.vue'
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
          tag: 'CuteUSB',
          img: 'images/CuteUSB.jpg',
          yt: 'https://youtube.com/CuteUSB',
          web: '',
          fb: 'https://www.facebook.com/ChanelOscar929',
          github: 'https://github.com/cskevinc',
          intro: 'NULL'
        },
        {
          name: '哈密瓜',
          tag: 'hamigua',
          img: 'https://yt3.ggpht.com/fDFu82cgxhrpx00xLlUz-hIJbJRM9i-StKqKOIn_BOKIF1YzMJGKmdqT7p-zdyHf4B5_bCFNog=s176-c-k-c0x00ffffff-no-rj-mo',
          yt: 'https://youtube.com/哈密瓜',
          web: 'https://hamigua.cutespirit.org/',
          // fb: '',
          github: 'https://github.com/y1220asdf',
          intro: '人不錯'
        },
        {
          name: '凜月',
          tag: 'NingYue',
          img: 'https://cdn.discordapp.com/avatars/983627634284048474/343bc24e156e1526aedefa7ccd46bfb9.webp?size=128',
          yt: '',
          web: '',
          fb: '',
          github: '',
          intro: '一個好人'
        }
      ],
      searchData: []
    }
  },
  created () {
    this.searchData = this.friendData
  },
  watch: {
    cacheSearch () {
      this.searchData = this.friendData.filter((item) => {
        // console.log(item);
        return item.name.toUpperCase().match(this.cacheSearch.toUpperCase())
      })
    }
  }
}
</script>
