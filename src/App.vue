<template>
  <div class="bs-5" style="position: fixed;">
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
        請注意，夏特稀個人網站正在進行大更新，將全面改為 Vue CLI 架構，如要查看完整頁面，<a href="https://www2.tershi.com" class="alert-link">請回到舊正式版網頁</a>. 並等待網站全面更新完成。中華民國 111 年 11 月 04 日
      </div>
    </div>
  </div>
  <router-view/>
</template>

<script>
const a1 = document.createElement('script')
a1.setAttribute('src', '/js/jquery.min.js')
document.head.appendChild(a1)

const a2 = document.createElement('script')
a2.setAttribute('src', '/js/jquery.scrollex.min.js')
document.head.appendChild(a2)

const a3 = document.createElement('script')
a3.setAttribute('src', '/js/jquery.scrolly.min.js')
document.head.appendChild(a3)

const a4 = document.createElement('script')
a4.setAttribute('src', '/js/browser.min.js')
document.head.appendChild(a4)

const a5 = document.createElement('script')
a5.setAttribute('src', '/js/breakpoints.min.js')
document.head.appendChild(a5)

const a6 = document.createElement('script')
a6.setAttribute('src', '/js/util.js')
document.head.appendChild(a6)

const a7 = document.createElement('script')
a7.setAttribute('src', '/js/main.js')
document.head.appendChild(a7)
</script>

<style lang="scss">
@import './assets/all.scss';
@import './assets/css/main.css';
@import './assets/css/fontawesome-all.min.css';

</style>
