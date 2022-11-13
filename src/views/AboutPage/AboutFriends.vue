<template>
  <div>

    <h1>夏特稀的好朋友</h1>
    <p>這裡記錄著我跟我的朋友的點點滴滴和關係</p>

    <!-- 搜尋 -->
    <div class="form-floating text-dark mb-3">
      <textarea class="form-control" placeholder="搜尋夏特稀的捧由ㄅ!" id="searchDeveloper" v-model="cacheSearch"></textarea>
      <label for="searchDeveloper">搜尋夏特稀的捧由ㄅ!</label>
    </div>
    <p class="fs-6">小提示！可以點選名字查看詳細內容喔。 <br> 朋友數量: {{ friendData.length }}</p>

    <!-- 申請加入的按鈕 -->
    <button type="button" class="d-flex p-2 btn btn-outline-warning text-white" data-bs-toggle="offcanvas" data-bs-target="#offcanvasExample" aria-controls="offcanvasExample">
      查看全部
    </button>
    <div class="btn-group" role="group" aria-label="Basic radio toggle button group mb-3">
      <div class="mb-3">
        <button type="button" class="btn btn-outline-success text-white" data-bs-toggle="modal" data-bs-target="#signAddbtn">
          申請加入
        </button>
        <!-- <a type="button" class="btn btn-outline-success text-white" data-bs-toggle="modal" data-bs-target="signAddbtn" name="signupadd_btnradio" id="signupadd" autocomplete="off" >
          申請加入
        </a> -->
      </div>

      <!-- 朋友展開的按鈕 -->
      <div class="mb-3">
        <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off" @click="change('')" checked>
        <label class="btn btn-outline-info text-white" for="btnradio2">全部</label>
      </div>
      <div v-for="(item, key) in friendData" :key="key" class="mb-3 ">
        <input v-if="key<3" v-model="cacheSearch" :href="`#`+item.name" type="radio" class="btn-check" name="btnradio" :id="item.name" autocomplete="off" @click="change(item.tag)" :value="item.tag">
        <label v-if="key<3" class="btn btn-outline-info text-white" :for="item.name">{{ item.name }}</label>
      </div>
    </div>

    <!-- 如果有不只一個人，則分開顯示 -->
    <div class="row row-cols-1 g-4 row-cols-md-3" v-if="searchData.length != 1">
      <Card
        v-for="(item, key) in searchData"
        :key="key"
        @cache-search="getReturnData"
        :name="item.name"
        :nic_name="item.nic_name"
        :intro="item.intro"
        :tag="item.tag"
        :img="item.img"
        :link="item.link"
        border_color="#00fffe"
        img_style="width: 101.59px; height: 101.59px"
        style="width: 100%"
        ></Card>
    </div>
    <!-- 如果只有一個人，則展開 -->
    <div v-else>
      <Card
        v-for="(item, key) in searchData"
        :key="key"
        @cache-search="getReturnData"
        :name="item.name"
        :nic_name="item.nic_name"
        :intro="item.intro"
        :tag="item.tag"
        :img="item.img"
        :link="item.link"
        border_color="#00fffe"
        img_style="width: 150px; height: 150px;"
        style="width: 100%;"
        ></Card>
    </div>

    <!-- 顯示「申請加入」鈕 -->
    <SignUpModal></SignUpModal>
    <Sidebar name="這是我的好捧由們" content="點點看吧，可以展開喔" :data="friendData" @cache-search="getReturnData"></Sidebar>
  </div>
</template>

<script>
import Card from '@/components/AboutPage/AboutFriend.vue'
import SignUpModal from '@/components/AboutPage/ModalSignAdd.vue'
import Sidebar from '@/components/SidebarSection.vue'

export default {
  components: {
    Card,
    SignUpModal,
    Sidebar
  },
  data () {
    return {
      cacheSearch: '',
      searchData: [],
      friendData: [
        {
          name: 'CuteUSB',
          nic_name: '萌弟',
          tag: 'CuteUSB_Page',
          img: require('@/assets/images/CuteUSB.jpg'),
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
          tag: 'hamigua_Page',
          img: require('@/assets/images/Cute哈密瓜.jpg'),
          intro: '是個好人',
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
          tag: 'NingYue_Page',
          img: 'https://cdn.discordapp.com/avatars/983627634284048474/343bc24e156e1526aedefa7ccd46bfb9.webp?size=128',
          intro: '是個好人，高雄電神',
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
        },
        {
          name: 'YYJ',
          nic_name: 'YYJ',
          tag: 'YYJ_Page',
          img: 'https://avatars.githubusercontent.com/u/68520446?v=4',
          intro: '多才多藝的電神',
          link: [
            {
              name: 'Facebook',
              link: 'https://www.facebook.com/profile.php?id=100064249505130',
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
              link: 'https://github.com/YYJ-TW',
              color: 'dark'
            },
            {
              name: 'YouTube',
              link: 'https://www.youtube.com/channel/UCkeR-bsZ1SJtyStYcZjJSFw?view_as=subscriber',
              color: 'danger'
            },
            {
              name: 'Website',
              link: 'https://yyjstudio.com/',
              color: 'primary'
            }
          ]
        },
        {
          name: 'Eric',
          nic_name: 'Eric',
          tag: 'Eric_Page',
          img: 'https://avatars.githubusercontent.com/u/57433754?v=4',
          intro: '大電神',
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
              link: 'https://github.com/Eric101201',
              color: 'dark'
            },
            {
              name: 'YouTube',
              link: '',
              color: 'danger'
            },
            {
              name: 'Website',
              link: 'https://eric-wu.xyz/',
              color: 'primary'
            }
          ]
        },
        {
          name: 'Hayron',
          nic_name: '拳爸',
          tag: 'Hayron_Page',
          img: 'https://cdn.discordapp.com/avatars/373837783472537600/8f43fafc2d8ede9e988a04cfc7c7d482.webp?size=128',
          intro: '人工智慧電神',
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
              link: 'https://github.com/DJHayron',
              color: 'dark'
            },
            {
              name: 'YouTube',
              link: '',
              color: 'danger'
            },
            {
              name: 'Website',
              link: 'https://hayron.tershi.com/',
              color: 'primary'
            }
          ]
        },
        {
          name: 'Liu',
          nic_name: 'Liu',
          tag: 'Liu_Page',
          img: require('@/assets/images/liu.webp'),
          intro: '是位很強的大佬',
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
        },
        {
          name: 'YYW',
          nic_name: 'YYW',
          tag: 'YYW_Page',
          img: require('@/assets/images/yyw.png'),
          intro: '一個前端好像挺強的朋友',
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
              link: 'https://github.com/yywbadm',
              color: 'dark'
            },
            {
              name: 'YouTube',
              link: 'https://www.youtube.com/channel/UCVssTv4Cyd_DdO-mFyKaDlg',
              color: 'danger'
            },
            {
              name: 'Website',
              link: 'http://haimo.tk/',
              color: 'primary'
            }
          ]
        },
        {
          name: '玟珄',
          nic_name: 'Min Xuan',
          tag: 'MinXuan_Page',
          img: require('@/assets/images/xiaoqing.gif'),
          intro: '聽說身高180體重53的人類，也是小琉球的人類',
          link: [
            {
              name: 'Facebook',
              link: '',
              color: 'primary'
            },
            {
              name: 'Instagram',
              link: 'https://www.instagram.com/shuanqing',
              color: 'danger',
              style: 'background-color: #d63384'
            },
            {
              name: 'Github',
              link: 'https://github.com/hehe6272',
              color: 'dark'
            },
            {
              name: 'YouTube',
              link: 'https://www.MinXuan.ga',
              color: 'danger'
            },
            {
              name: 'Website',
              link: 'https://haimo.tk',
              color: 'primary'
            }
          ]
        },
        {
          name: '巧克力粉',
          nic_name: 'choco',
          tag: 'jacchwill_Page',
          img: require('@/assets/images/jacchwill.jpg'),
          intro: ':>',
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
              link: 'https://github.com/jacchwill',
              color: 'dark'
            },
            {
              name: 'YouTube',
              link: 'https://www.youtube.com/channel/UCC-JWFr3gT9a7xDgvnydyFw',
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
          name: '臘腸',
          nic_name: 'lawlaw777',
          tag: 'lawlaw777_Page',
          img: require('@/assets/images/lawlaw.jpg'),
          intro: '資工科辣個最強的男人',
          link: [
            {
              name: 'Facebook',
              link: '',
              color: 'primary'
            },
            {
              name: 'Instagram',
              link: 'https://www.instagram.com/lawrencelee0113/',
              color: 'danger',
              style: 'background-color: #d63384'
            },
            {
              name: 'Github',
              link: 'https://github.com/LawrenceLee0113',
              color: 'dark'
            },
            {
              name: 'YouTube',
              link: '',
              color: 'danger'
            },
            {
              name: 'Website',
              link: 'https://lawrencelee0113.github.io/homework2022/',
              color: 'primary'
            }
          ]
        },
        {
          name: '胡栩睿',
          nic_name: '海豹',
          tag: '海豹_Page',
          img: require('@/assets/images/ray022558.jpg'),
          intro: '沈迷於網路的海豹',
          link: [
            {
              name: 'Facebook',
              link: 'https://www.facebook.com/profile.php?id=100009866177157',
              color: 'primary'
            },
            {
              name: 'Instagram',
              link: 'https://www.instagram.com/ray022558/',
              color: 'danger',
              style: 'background-color: #d63384'
            },
            {
              name: 'Github',
              link: 'https://github.com/ray970225',
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
        },
        {
          name: '賴皮鬼',
          nic_name: 'laievantw',
          tag: 'laievantw_Page',
          img: require('@/assets/images/laipi.png'),
          intro: '一個很帥的人w',
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
              link: 'https://www.youtube.com/channel/UCMyohR24XB_hwYAUK0LXK9w',
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
          name: '黃奕宣',
          nic_name: 'HYS',
          tag: 'HYS_Page',
          img: '',
          intro: 'NULL',
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
      ]
    }
  },
  created () {
    this.searchData = this.friendData
  },
  watch: {
    cacheSearch: function (val) {
      this.searchData = this.friendData.filter((item) => {
        // 如果沒有搜尋到 name
        if (item.name.toUpperCase().includes(this.cacheSearch.toUpperCase())) {
          return item.name.toUpperCase().includes(this.cacheSearch.toUpperCase())
        } else if (item.tag.toUpperCase().includes(this.cacheSearch.toUpperCase())) {
          return item.tag.toUpperCase().includes(this.cacheSearch.toUpperCase())
        } else if (item.intro.toUpperCase().includes(this.cacheSearch.toUpperCase())) {
          return item.intro.toUpperCase().includes(this.cacheSearch.toUpperCase())
        } else if (item.nic_name.toUpperCase().includes(this.cacheSearch.toUpperCase())) {
          return item.nic_name.toUpperCase().includes(this.cacheSearch.toUpperCase())
        } else {
          return false
        }
      })
    }
  },
  methods: {
    change (name) {
      this.cacheSearch = name
    },
    getReturnData (data) {
      this.cacheSearch = data
    }
  }
}
</script>
