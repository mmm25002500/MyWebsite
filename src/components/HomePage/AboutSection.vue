<template>
  <section id="about" class="main inactive">
    <div class="spotlight">
      <div class="content">
        <header class="major">
          <h2>關於我</h2>
        </header>
        <p>我是一個在台灣通過自主學習程式語言的一個高中生，擁有將近五年使用Linux系統的經驗，也有開發專案的經驗，我也喜歡拍影片剪影片。</p>
        <ul class="actions">
          <li><router-link to="/about" class="button">查看更多</router-link></li>
          <!-- <li><a target="_blank" href="about" class="button"></a></li> -->
        </ul>
      </div>
      <span class="image"><img src="images/img.webp" alt=""></span>
    </div>
  </section>
</template>

<script>
export default {
  name: 'HomeAbout'
}
</script>
