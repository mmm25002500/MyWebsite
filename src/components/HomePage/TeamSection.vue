<template>
  <section id="team" class="main special inactive">
    <header class="major">
      <h2>創立團隊</h2>
      <p>
        2015/03/14 我創立了ASSL團隊，持續了將近6年半。<br>
        2021/07/15 我與好朋友成立了靈萌團隊，由於先前已有經驗了，直接開商店。<br>
        2022/06/01 和許多好朋友共同開發專案，學習更多知識。
      </p>
    </header>
    <footer class="major">
      <ul class="actions special">
        <li><a target="_blank" href="/oldSite/index.html" class="button">夏特稀舊網站</a></li>
        <li><router-link to="/team/join" class="button">加入靈萌</router-link></li>
        <!-- <li><a target="_blank" href="/signup.html" class="button">加入靈萌</a></li> -->
        <li><router-link to="/team/more" class="button primary">查看更多</router-link></li>
        <!-- <li><a target="_blank" href="/team.php" class="button primary">查看更多</a></li> -->
        <li><a target="_blank" href="https://www.cutespirit.org/" class="button">靈萌官網</a></li>
        <li><a target="_blank" href="https://shop.cutespirit.org/" class="button">靈萌商店</a></li>
      </ul>
      <ul class="actions special">
        <li><router-link to="/menu" class="button primary">進入選單</router-link></li>
        <!-- <li><a target="_blank" href="/menu.php" class="button primary">進入選單</a></li> -->
      </ul>
    </footer>
  </section>
</template>

<script>
export default {
  name: 'HomeTeam'
}
</script>
