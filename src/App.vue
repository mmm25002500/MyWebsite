<template>
  <!-- <nav class="navbar navbar-expand-lg bg-light">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">夏特稀個人網頁</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav">
          <li class="nav-item">
            <a class="nav-link active" aria-current="page" href="#">主頁</a>
          </li>
          <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" id="navbarScrollingDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Link
          </a>
          <ul class="dropdown-menu" aria-labelledby="navbarScrollingDropdown">
            <li><a class="dropdown-item" href="#">Action</a></li>
            <li><a class="dropdown-item" href="#">Another action</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#">Something else here</a></li>
          </ul>
        </li>
          <li class="nav-item">
            <a class="nav-link" href="#">關於靈萌</a>
          </li>
        </ul>
      </div>
    </div>
  </nav> -->
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark" style="background-color: rgb(176 176 176 / 0%) !important;">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">
        <!-- <img :src="require('@/assets/icon.png')" alt="" width="30" class="d-inline-block align-text-top"> -->
        {{ SERVER_CONFIG.title }}
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarSupportedContent">

        <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
          <li class="nav-item" v-for="(item, key) in data" :key="key" :class="item.children? 'dropdown':''">
            <div v-if="item.outside">
              <a class="nav-link text-white" :href="item.url" target="_blank">
                <font-awesome-icon :icon="item.icon" class="icon alt" style="color: #ffffff;" />
                {{ item.name }}
              </a>
            </div>
            <div v-else>
              <div v-if="item.children">
                <a class="nav-link dropdown-toggle text-white" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                      <font-awesome-icon :icon="item.icon" class="icon alt" style="color: #ffffff;" />
                      {{ item.name }}
                </a>
                <ul class="dropdown-menu" style="background-color: rgb(7 6 6 / 82%) !important;" aria-labelledby="navbarDropdown">
                  <li v-for="(child, key2) in item.children" :key="key2">
                    <router-link :to="child.path" class="dropdown-item text-dark" href="#">
                      <font-awesome-icon :icon="child.icon" class="icon alt" style="color: #ffffff;" />
                      <span style="color: #ffffff;">&nbsp;{{ child.name }}</span>
                    </router-link>
                  </li>
                  <!-- <li><hr class="dropdown-divider"></li> -->
                </ul>
              </div>
              <div v-else>
                <router-link class="nav-link" :to="item.url">
                  <div class="text-white">
                    <font-awesome-icon :icon="item.icon" class="icon alt" style="color: #ffffff;" />
                    {{ item.name }}
                  </div>
                </router-link>
              </div>
            </div>
          </li>
        </ul>

        <!-- <form class="d-flex me-2">
          <input class="form-control" type="search" placeholder="來找點樂子吧(尚未完成)" aria-label="Search" v-model="navCacheSearch">
        </form>
        <div class="d-flex justify-content-start">
          <button type="button" class="btn btn-outline-success me-2" @click="checkContent()">
            <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="icon alt" />
            搜尋
          </button>
          <button type="button" class="d-flex btn btn-outline-success me-2" @click="$refs.LoginModal.showModal()">
            登入
          </button>

          <button class="d-flex btn btn-outline-info" @click="$refs.SignupModal.showModal()">
            註冊
          </button>
        </div> -->
      </div>
    </div>
  </nav>
  <div style="bottom: 0px; width: 100%; z-index: 1">
    <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
      <symbol id="check-circle-fill" fill="currentColor" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
      </symbol>
      <symbol id="info-fill" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
      </symbol>
      <symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      </symbol>
    </svg>
    <div class="alert alert-success d-flex align-items-center" role="alert">
      <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
      <div>
        目前已經更新至 v0.4版，已經完成首頁了！
        <router-link to="/webchangelog" class="text-info">到更新日誌中查看</router-link>
      </div>
    </div>
  </div>
  <div style="position: fixed; bottom: 0px; width: 100%; z-index: 1">
    <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
      <symbol id="check-circle-fill" fill="currentColor" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
      </symbol>
      <symbol id="info-fill" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
      </symbol>
      <symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      </symbol>
    </svg>
    <div class="alert alert-danger d-flex align-items-center" role="alert">
      <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
      <div>
        請注意！！夏特稀個人網站正在進行大更新，將全面改為 Vue CLI 架構，目前新版頁面功能尚未完成，正在製作開發。如要查看完整頁面，<a href="https://www2.tershi.com" class="alert-link text-info">請回到舊正式版網頁</a>. 並等待網站全面更新完成。中華民國 111 年 11 月 04 日
      </div>
    </div>
  </div>
  <div class="container">
    <transition
      mode="out-in"
      enter-active-class="animate__animated animate__fadeIn"
      leave-active-class="animate__animated animate__fadeOut"
      >
      <router-view />
    </transition>
    <hr>
    <p class="copyright text-center">&copy; Copyright 2022. TershiXia</p>
  <!-- <router-view /> -->
  </div>
</template>

<script>
export default {
  data () {
    return {
      SERVER_CONFIG: {
        title: 'TershiXia'
      },
      data: [
        {
          name: '主頁',
          url: '/',
          icon: ['fas', 'house'],
          outside: false
        },
        {
          name: '關於我',
          url: '/about',
          icon: ['fas', 'address-card'],
          children: [
            {
              name: '關於我',
              icon: ['fas', 'chalkboard-user'],
              path: '/about/me'
            },
            {
              name: '目標',
              icon: ['fas', 'bullseye'],
              path: '/about/goal'
            },
            {
              name: '作品',
              icon: ['fas', 'code'],
              path: '/about/works'
            },
            {
              name: '我的好朋友們',
              icon: ['fas', 'user-group'],
              path: '/about/friends'
            },
            {
              name: '創立團隊',
              icon: ['fas', 'building'],
              path: '/about/team/short'
            }
          ],
          outside: false
        },
        {
          name: '加入我們',
          url: '/team/join',
          icon: ['fas', 'user-plus'],
          outside: false
        },
        {
          name: '我的專案',
          url: '/projects',
          icon: ['fas', 'terminal'],
          outside: false
        },
        {
          name: '更新日誌',
          url: '/webchangelog',
          icon: ['fas', 'file-invoice'],
          outside: false
        },
        {
          name: '回到舊版網站',
          url: 'https://www2.tershi.com',
          icon: ['fas', 'rotate-left'],
          outside: true
        }
      ]
    }
  },
  mounted () {
    window.scrollTo(0, 0)
    // const alljs = document.createElement('script')
    // alljs.setAttribute('src', '/js/all.js')
    // document.head.appendChild(alljs)
  }
}
</script>

<style lang="scss">
@import './assets/all.scss';
// @import './assets/css/main.css';
// @import './assets/css/fontawesome-all.min.css';
body {
  // color: rgba(255,255,255,.65);
  // background-color: #935d8c;
  // background-image: url("assets/images/bg.jpg"),-moz-linear-gradient(45deg,#e37682 15%,#5f4d93 85%);
  // background-image: url("assets/images/bg.jpg"),-webkit-linear-gradient(45deg,#e37682 15%,#5f4d93 85%);
  // background-image: url("assets/images/bg.jpg"),-ms-linear-gradient(45deg,#e37682 15%,#5f4d93 85%);
  // background-image: url("assets/images/bg.jpg"),linear-gradient(45deg,#27b5d7 15%,#554fc7 85%);
  // padding-top: 80px;
  background-image: linear-gradient(0deg,rgba(19,21,25,.5),rgba(19,21,25,.5)),url(assets/images/bg.jpg);
  // color: #fff;
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-position: 50%;
  background-size: cover;
  color: white;
}
</style>
