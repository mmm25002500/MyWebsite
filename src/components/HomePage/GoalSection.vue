<template>
  <section id="goal" class="main special inactive">
    <header class="major">
      <h2>我的目標</h2>
    </header>
    <ul class="features">
      <li>
        <span class="icon solid major style1 fa-code"></span>
        <h3>打造出靈萌服務</h3>
        <p>我從小就很喜歡寫程式，我的目標是打造出一個類似Google的服務，喜歡程式語言的我，目前正在點好點滿我的技能樹。</p>
      </li>
      <li>
        <span class="icon major style3 fa-copy"></span>
        <h3>成立公司</h3>
        <p>今年，我成立了靈萌商店，目前只支援代購，以後會開放買賣各種團內開發的產品，也打算磨練幾年，開公司。</p>
      </li>
      <li>
        <span class="icon major style5 fa-gem"></span>
        <h3>考上好大學 - 已達成</h3>
        <p>由於我國是一個重學歷的國家，有個好的學歷人人稱羨，目前我也只是個普通的高中生，想考個好大學，讓父母驕傲。</p>
      </li>
    </ul>
    <footer class="major">
      <ul class="actions special">
        <li><router-link to="/goal" class="button">查看更多</router-link></li>
        <!-- <li><a target="_blank" href="/goal/" class="button">查看更多</a></li> -->
      </ul>
    </footer>
  </section>
</template>

<script>
export default {
  name: 'HomeGoal'
}
</script>
