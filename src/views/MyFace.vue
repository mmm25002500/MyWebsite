<template>
  <div>
    <h1>我好可愛</h1>

    <!-- 播放 RickRoll 影片 -->
    <!--
      src: 來源,
      controls: 顯示控制列,
      autoplay: 自動播放,
      loop: 循環播放,
      volume: 音量
    -->
    <video-player
      class="vjs-fluid"
      controls
      :src="require('@/assets/rickroll.mp4')"
      :loop="true"
      :volume="0.6"
      :autoplay="true"
    ></video-player>
  </div>
</template>

<script>
export default {

}
</script>
