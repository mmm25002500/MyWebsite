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
          <h4 class="text-center">創新軟體，造福人類</h4>
          <p style="text-align:justify;">小時候有個夢想，就是想做一個可以整合所有功能的服務，類似於 Google，並且持續創新，廣納想法，將想法實現，造福人類。</p>
        </div>
        <div class="col">
          <span class="d-flex justify-content-center">
            <font-awesome-icon :icon="['fas', 'building']" class="fs-1" style="color: #a89cc8;" />
          </span>
          <h4 class="text-center">創業實現夢想</h4>
          <p style="text-align:justify;">我知道要將夢想達成不容易，但腦中有許多想法的我，可以將想法化作資本，透過資本去實現夢想，跟朋友成立過代購的我，深知創業的不容易和嚴謹，同時要具備創新和毅力，才能將夢想實現。</p>
        </div>
        <div class="col">
          <span class="d-flex justify-content-center">
            <font-awesome-icon :icon="['fas', 'hands-holding-child']" class="fs-1" style="color: #8cc9f0;" />
          </span>
          <h4 class="text-center">回饋社會，培養人才</h4>
          <p style="text-align:justify;">由於從小到大學習程式設計都是透過自學，了解到自學的不容易，通常新手都很容易被網路上的龐大知識量勸退，但自學又是基本的技能，如果未來能讓新手突破這個困境，也可以讓台灣資訊領域變得更強，成為資訊大國</p>
        </div>
      </div>
      <div class="btn-group" role="group" aria-label="Basic example">
        <router-link to="/about/goal" >
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
