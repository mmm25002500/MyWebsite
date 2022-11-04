<template>
  <footer id="footer">
    <section>
      <h2>關於靈萌</h2>
      <p>靈萌團隊是一個民主自由且追求的團隊，我們正為了同一個目標努力，我們還有專屬於我們的Github Organization，我們團隊有經驗豐富的大佬與活潑的團員。如果你也喜歡我們並且也想撐起台灣的資訊業，可以加入我們呦。</p>
      <ul class="actions">
        <li><router-link to="/signup" class="button">加入靈萌</router-link></li>
        <!-- <li><a target="_blank" href="https://www.cutespirit.org/#join" class="button">加入靈萌</a></li> -->
      </ul>
    </section>
      <section>
      <h2>聯繫我們</h2>
      <dl class="alt">
        <dt>MyGamil</dt>
        <dd><a href="mailto:marryhan25648@gmail.com">marryhan25648@gmail.com</a></dd>
        <dt>MyEmail</dt>
        <dd><a href="mailto:admin@tershi.com">admin@tershi.com</a></dd>
        <dt>團電郵</dt>
        <dd><a href="mailto:tershi@cutespirit.org">service@cutespirit.org(棄用)</a></dd>
      </dl>
      <ul class="icons">
        <!--<li><a target="_blank" href="#" class="icon brands fa-twitter alt"><span class="label">Twitter</span></a></li> -->
        <li><a target="_blank" href="https://www.facebook.com/TershiXia/" class="icon brands fa-facebook-f alt"><span class="label">Facebook</span></a></li>
        <li><a target="_blank" href="https://www.instagram.com/tershixia/" class="icon brands fa-instagram alt"><span class="label">Instagram</span></a></li>
        <li><a target="_blank" href="https://github.com/mmm25002500" class="icon brands fa-github alt"><span class="label">GitHub</span></a></li>
        <li><a target="_blank" href="http://youtube.com/%E5%A4%8F%E7%89%B9%E7%A8%80" class="icon brands fa-youtube alt"><span class="label">Dribbble</span></a></li>
      </ul>
    </section>
      <p class="copyright">&copy; Cutespirit {{new Date().getFullYear()}}.</p>
  </footer>
</template>

<script>
export default {
  name: 'HomeFooter'
}
</script>
