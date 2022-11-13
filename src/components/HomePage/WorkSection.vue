<template>
  <section id="work" class="main special inactive">
    <header class="major">
      <h2>作品</h2>
      <p>目前我有寫一些自己的Side-Project<br>是利用課餘時間，用自己的興趣，不斷自己上網自主學習來的。</p>
    </header>
    <ul class="statistics">
      <li class="style1">
        <span class="icon solid fa-code-branch"></span>
        <!-- <strong>{{githubPRData.total_count}}</strong> Github PR -->
      </li>
      <li class="style2">
        <span class="icon fa-folder-open"></span>
        <!-- <strong>{{githubUserData.public_repos}}</strong> Github Repo -->
      </li>
      <li class="style3">
        <span class="icon solid fa-file"></span>
        <strong>230</strong> 網站
      </li>
      <li class="style4">
        <span class="icon brands fa-youtube"></span>
        <strong>
          <!-- PHP TOKEN -->
        </strong> YouTube影片
      </li>
      <!--<li class="style5">
        <span class="icon fa-gem"></span>
        <strong>1,024</strong> Nullam
      </li>-->
    </ul>
    <p class="content">這些是從我開始寫程式到現在還能找到的專案、影片、網站，裡面這些內容可以看出我從最一開始的新手到現在的規模，裡面的作品都是我花了很久的時候做的。例如影片，從剛開始的威力導演到現在的Premiere和After Effects，剪接和特效功力有大大提升，有句說得好：「技術就是經驗累積而成的，只有不斷失敗才會成功」。網站也是我利用課餘時間製作的，從早期只會HTML基本，到現在的CSS和Javascript併用，或者用點vue.js都是在正常不過的了！</p>
    <footer class="major">
      <ul class="actions special">
        <li><router-link to="/work" class="button">查看更多</router-link></li>
        <!-- <li><a target="_blank" href="/work.php" class="button">查看更多</a></li> -->
      </ul>
    </footer>
  </section>
</template>

<script>
export default {
  name: 'HomeWork'
}
</script>
