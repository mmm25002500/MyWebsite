<template>
  <section id="friends" class="main inactive">
    <div class="spotlight">
      <div class="content">
        <header class="major">
          <h2>我的好朋友們</h2>
        </header>
        <p>這裡記錄著我跟我的朋友的點點滴滴和關係，一起共事、玩樂的好夥伴們。</p>
        <ul class="actions">
          <li><router-link to="/myfriend" class="button">查看更多</router-link></li>
          <!-- <li><a target="_blank" href="/myfriend.php" class="button">查看更多</a></li> -->
        </ul>
      </div>
      <!-- <span class="image"><img src="images/CuteUSB.jpg" alt=""></span> -->
    </div>
  </section>
</template>

<script>
export default {
  name: 'HomeFriends'
}
</script>
