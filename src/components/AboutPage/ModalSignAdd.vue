<template>
  <div>
    <div class="modal fade text-dark" id="signAddbtn" tabindex="-1" aria-labelledby="signaddfriendmodal" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5" id="signaddfriendmodal">申請加入朋友(未完成)</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">

        <label class="form-label">個人資料</label>
        <div class="input-group mb-3">
          <input type="text" class="form-control" placeholder="真實姓" aria-label="真實姓">
          <!-- <span class="input-group-text">@</span> -->
          <input type="text" class="form-control" placeholder="真實名" aria-label="真實名">
          <input type="text" class="form-control" placeholder="暱稱" aria-label="暱稱">
        </div>

        <label class="form-label">第三方網站</label>
        <div class="input-group mb-3">
          <span class="input-group-text" id="basic-addon1">@</span>
          <input type="text" class="form-control" placeholder="你的Github" aria-label="你的Github" aria-describedby="basic-addon1">

          <span class="input-group-text" id="basic-addon1">@</span>
          <input type="text" class="form-control" placeholder="你的YouTube" aria-label="你的YouTube" aria-describedby="basic-addon1">
        </div>

        <div class="input-group mb-3">
          <span class="input-group-text" id="basic-addon1">@</span>
          <input type="text" class="form-control" placeholder="你的Facebook" aria-label="你的Facebook" aria-describedby="basic-addon1">
          <span class="input-group-text" id="basic-addon1">@</span>
          <input type="text" class="form-control" placeholder="你的Instagram" aria-label="你的Instagram" aria-describedby="basic-addon1">
        </div>

        <div class="input-group mb-3">
          <span class="input-group-text" id="basic-addon3">https://</span>
          <input type="text" class="form-control" placeholder="你的網站" id="yourWebsite" aria-describedby="basic-addon3">
        </div>

        <label class="form-label">網頁設定</label>
        <div class="input-group mb-3">
          <input type="text" class="form-control" placeholder="使用者名稱" aria-label="使用者名稱" aria-describedby="basic-addon2">
          <span class="input-group-text" id="basic-addon2">@tershi.com</span>
        </div>

        <div class="input-group mb-3">
          <span class="input-group-text" id="basic-addon3">https://tershi.com/about/friends/</span>
          <input type="text" class="form-control" placeholder="使用者名稱" id="basic-url" aria-describedby="basic-addon3">
        </div>

        <label class="form-label">其他</label>
        <div class="input-group">
          <span class="input-group-text">自我介紹</span>
          <textarea class="form-control" aria-label="introme"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
        <button type="button" class="btn btn-primary">送出</button>
      </div>
    </div>
  </div>
</div>
  </div>
</template>

<script>
// import bootstrap from 'bootstrap'
export default {
  // data () {
  //   return {
  //     modal: ''
  //   }
  // },
  // methods: {
  //   showModal () {
  //     this.modal.show()
  //   },
  //   hideModal () {
  //     this.modal.hide()
  //   }
  // },
  // mounted () {
  //   this.modal = new bootstrap.Modal(this.$refs.Modal)
  // }
}
</script>
