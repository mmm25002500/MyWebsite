<template>
  <div style="position:relative;">
    <!-- 載入導覽列 -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark" style="background-color: rgb(176 176 176 / 0%) !important;">
      <div class="container-fluid">
        <a class="navbar-brand" @click.prevent="$router.push({ path: '/' })" href="">
          <!-- <img :src="require('@/assets/icon.png')" alt="" width="30" class="d-inline-block align-text-top"> -->
          <!-- 載入標題 -->
          {{ SERVER_CONFIG.title }}
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarSupportedContent">

          <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
            <!-- 如果有下拉式選單，就顯示下拉式選單 -->
            <li class="nav-item" v-for="(item, key) in data" :key="key" :class="item.children? 'dropdown':''">

              <!-- 如果是外部連結 -->
              <div v-if="item.outside">
                <a class="nav-link" :href="item.url" target="_blank">
                  <font-awesome-icon :icon="item.icon" class="icon alt" style="color: #ffffff;" />
                  {{ item.name }}
                </a>
              </div>

              <!-- 如果是內部連結 -->
              <div v-else>
                <!-- 如果是下拉式選單 -->
                <div v-if="item.children">
                  <!-- 載入第一個下拉式選單 -->
                  <a class="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <font-awesome-icon :icon="item.icon" class="icon alt" style="color: #ffffff;" />
                    {{ item.name }}
                  </a>
                  <!-- 載入裡面條目選單 -->
                  <ul class="dropdown-menu" style="background-color: rgb(7 6 6 / 82%) !important;" aria-labelledby="navbarDropdown">
                    <li v-for="(child, key2) in item.children" :key="key2">

                      <!-- 如果下拉式選單條目是外部連結 -->
                      <div v-if="child.outside">
                        <a class="dropdown-item" :href="child.url" target="_blank">
                          <font-awesome-icon :icon="child.icon" class="icon alt" style="color: #ffffff;" />
                          <span style="color: #ffffff;">{{ child.name }}</span>
                        </a>
                      </div>

                      <!-- 如果下拉式選單條目是內部連結 -->
                      <div v-else>
                        <router-link :to="child.url" class="dropdown-item">
                          <div data-bs-toggle="collapse" data-bs-target=".navbar-collapse.show">
                            <font-awesome-icon :icon="child.icon" class="icon alt" style="color: #ffffff;" />
                            <span style="color: #ffffff;">&nbsp;{{ child.name }}</span>
                          </div>
                        </router-link>
                      </div>
                    </li>
                    <!-- <li><hr class="dropdown-divider"></li> -->
                  </ul>
                </div>

                <!-- 如果是單純的條目 -->
                <div v-else>
                  <router-link class="nav-link" :to="item.url" >
                    <div data-bs-toggle="collapse" data-bs-target=".navbar-collapse.show">
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

    <!-- 顯示底下警告訊息 -->
    <div style="position: fixed; bottom: 0px; width: 100%; z-index: 1">

      <!-- 載入 svg 圖示 -->
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

      <!-- 載入警告訊息 -->
      <!-- <div class="alert alert-danger d-flex align-items-center" role="alert">
        <button type="button" class="btn-close align-self-start" data-bs-dismiss="alert" aria-label="Close"></button>
        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
        <div>
          請注意！！夏特稀個人網站正在進行大更新，將全面改為 Vue CLI 架構，目前新版頁面功能尚未完成，正在製作開發。如要查看完整頁面，<a href="https://www2.tershi.com" class="alert-link text-info">請回到舊正式版網頁</a>. 並等待網站全面更新完成。中華民國 111 年 11 月 04 日
        </div>
      </div> -->
    </div>

    <!-- 顯示上方提示訊息 -->
    <div class="container" ref="top-alert">
      <!-- 顯示在最上層: z-index -->
      <div style="bottom: 0px; width: 100%; z-index: 1">

        <!-- 載入 svg 圖示 -->
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

        <!-- 載入上方提示訊息 -->
        <div class="alert alert-success d-flex align-items-center" role="alert">
          <button type="button" class="btn-close align-self-start" data-bs-dismiss="alert" aria-label="Close"></button>
          <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
          <div>
            目前已經更新至 v0.16版，已完成大部分功能！
            <a class="text-info" href="/webchangelog" @click.prevent="$router.push({ path: '/webchangelog' })" >到更新日誌中查看</a>
            。中華民國 111 年 11 月 22 日，上一個版本更新日期為 111 年 11 月 21 日。
          </div>
        </div>

      </div>
      <!-- <Adsense
        data-ad-client="ca-pub-9107487734392446"
        data-ad-slot="1443478648"
      ></Adsense> -->
      <transition
        mode="out-in"
        enter-active-class="animate__animated animate__fadeIn"
        leave-active-class="animate__animated animate__fadeOut"
        >
        <router-view />
      </transition>
      <Footer></Footer>
      <back-to-top text="反回到最上面"></back-to-top>
    <!-- <router-view /> -->
    </div>
  </div>
</template>

<script>
import Footer from '@/components/FooterSection.vue'
import data from '@/assets/data/NavbarData.json'

export default {
  components: {
    Footer
  },
  data () {
    return {
      SERVER_CONFIG: {
        title: 'TershiXia'
      },
      data: data
    }
  },
  mounted () {
    // 每次載入都到最上層去
    window.scrollTo(0, 0)
    document.oncontextmenu = function () {
      return false
    }
  }
}
</script>

<style lang="scss">
// 載入所有 scss 包含 bootstrap...等等
@import './assets/all.scss';

body {
  // background-image: linear-gradient(0deg, rgba(61, 26, 69, 0.5), rgb(43 18 0 / 57%)), url(assets/images/bg.webp);
  // color: #fff;
  // background-repeat: no-repeat;
  // background-attachment: fixed;
  // background-position: 50%;
  // background-size: cover;
  background: #000010;
  color: white;
}
canvas{
  display: block;
  position: fixed;
  z-index: -999;
  top: 0;
}
p {
  text-align: justify;
}
// .nav-link:visited,
// .nav-link:link {
//   border-bottom: 2px solid transparent;
// }

.nav-link:hover,
.nav-link:active {
  border-bottom: 2px solid #1bcfc6;
}
.router-link-active{
  border-bottom: 2px solid #1bcfc6;
}
</style>
