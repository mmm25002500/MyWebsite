<template>

  <div class="card" id="about" style="background-color: rgb(85 186 255 / 58%) !important;">
    <!-- <div class="card-header">
      關於我
    </div> -->
    <div class="card-body">
      <div class="row row-cols-auto">
        <div class="col d-flex flex-column bd-highlight mb-3">
          <h3 class="card-title text-white text-center">夏特稀</h3>
          <div class="p-2 bd-highlight">
            <img src="images/img.webp" class="rounded-circle" style="width: 100px" alt="" />
          </div>
          <!-- <div class="p-2 bd-highlight">Flex item 3</div> -->
        </div>
        <div class="col">
          <!-- <span><img src="images/img.webp" class="rounded-circle" style="width: 100px" alt=""></span> -->
          <!-- <h3 class="card-title text-white text-center">夏特稀</h3> -->
        </div>
        <div class="col">
          <!-- <h3 class="card-title text-white">夏特稀</h3> -->
          <h5>經歷</h5>
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
            <li>暱稱：夏特稀</li>
            <li>性別：小男生</li>
          </ul>
        </div>
        <div class="col">
          <h5>自我介紹：</h5>
          <div class="card-text text-white">我是一個來自台灣的大學生，從小透過自主學習的方式，學習程式設計，小五開始學習網頁前端，國中開始觸碰程式設計和資訊安全。我的個性有時內向，有時外向，平常不太說話，但是如果有表現的機會也會努力展現自我，我對許多事物保有好奇心，喜歡探究未知的領域和思考。</div>
        </div>

      </div>
      <div class="btn-group" role="group" aria-label="Basic example">
        <router-link to="/about/me" >
          <button class="btn btn-primary">
            查看更多
          </button>
        </router-link>
        <!-- <li><a target="_blank" href="about" class="button"></a></li> -->
      </div>
    </div>
  </div>

</template>

<style>
</style>

<script>
export default {
  name: 'HomeAbout'
}
</script>
