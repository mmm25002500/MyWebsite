<template>

  <div class="card" id="about" style="background-color: rgb(85 186 255 / 58%) !important;">
    <!-- <div class="card-header">
      關於我
    </div> -->
    <div class="card-body">
      <h3>我的目標</h3>
      <div class="row">
        <div class="col">
          <span class="d-flex justify-content-center">
            <font-awesome-icon :icon="['fas', 'code']" class="fs-1" style="color: #efa8b0;" />
          </span>
          <h4 class="text-center">打造出靈萌服務</h4>
          <p style="text-align:justify;">我從小就很喜歡寫程式，我的目標是打造出一個類似Google的服務，喜歡程式語言的我，目前正在點好點滿我的技能樹。</p>
        </div>
        <div class="col">
          <span class="d-flex justify-content-center">
            <font-awesome-icon :icon="['fas', 'copy']" class="fs-1" style="color: #a89cc8;" />
          </span>
          <h4 class="text-center">成立公司</h4>
          <p style="text-align:justify;">今年，我成立了靈萌商店，目前只支援代購，以後會開放買賣各種團內開發的產品，也打算磨練幾年，開公司。</p>
        </div>
        <div class="col">
          <span class="d-flex justify-content-center">
            <font-awesome-icon :icon="['fas', 'gem']" class="fs-1" style="color: #8cc9f0;" />
          </span>
          <h4 class="text-center">考上好大學 - 已達成</h4>
          <p style="text-align:justify;">由於我國是一個重學歷的國家，有個好的學歷人人稱羨，目前我也只是個普通的高中生，想考個好大學，讓父母驕傲。</p>
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
      <!-- <font-awesome-icon :icon="['fas', 'code']" class="icon alt major style1" /> -->
    </div>
  </div>

</template>

<script>
export default {
  name: 'HomeGoal'
}
</script>
