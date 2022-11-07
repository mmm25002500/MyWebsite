<template>

  <div class="card" id="about" style="background-color: rgb(85 186 255 / 58%) !important;">
    <!-- <div class="card-header">
      關於我
    </div> -->
    <div class="card-body">
      <div class="row row-cols-auto">
        <div class="col">
          <span><img src="images/img.webp" class="rounded-circle" style="width: 100px" alt=""></span>
          <!-- <h3 class="card-title text-white text-center">夏特稀</h3> -->
        </div>
        <div class="col">
          <h3 class="card-title text-white">夏特稀</h3>
          <h5>經歷：</h5>
          <ul>
            <li>國二考到OCPJP</li>
            <li>資訊月競賽中區第二</li>
            <li>Google Study Jam</li>
            <li>Linux 6年經驗</li>
            <li>111年特殊選才正取一</li>
          </ul>
        </div>
        <div class="col">
          <h5>個人資料</h5>
          <ul>
            <li>夏特稀好帥ㄛ，還在寫</li>
            <li>夏特稀好帥ㄛ，還在寫</li>
            <li>夏特稀好帥ㄛ，還在寫</li>
            <li>夏特稀好帥ㄛ，還在寫</li>
            <li>夏特稀好帥ㄛ，還在寫</li>
          </ul>
        </div>
        <div class="col">
          <h5>自我介紹：</h5>
          <div class="card-text text-white">我是一個在台灣通過自主學習程式語言的一個高中生，擁有將近五年使用Linux系統的經驗，也有開發專案的經驗，我也喜歡拍影片剪影片。</div>
        </div>
      </div>

      <div class="btn-group" role="group" aria-label="Basic example">
        <router-link to="/about" >
          <button class="btn btn-primary">
            查看更多
          </button>
        </router-link>
        <!-- <li><a target="_blank" href="about" class="button"></a></li> -->
      </div>
      <!-- <a href="#" class="btn btn-primary">Go somewhere</a> -->
    </div>
  </div>

  <!-- <section id="about" class="main inactive">
    <div class="spotlight">
      <div class="content">
        <header class="major">
          <h2>關於我</h2>
        </header>
        <p>我是一個在台灣通過自主學習程式語言的一個高中生，擁有將近五年使用Linux系統的經驗，也有開發專案的經驗，我也喜歡拍影片剪影片。</p>
        <ul class="actions">
          <li><router-link to="/about" class="button">查看更多</router-link></li>
        </ul>
      </div>
      <span class="image"><img src="images/img.webp" alt=""></span>
    </div>
  </section> -->
</template>

<style>
/* .image {
    display: inline-block;
    margin-left: 4em;
    padding: .65em;
    border-radius: 100%;
    border: solid 1px;
    border-color: #ddd;
    width: 16em;
} */
</style>

<script>
export default {
  name: 'HomeAbout'
}
</script>
