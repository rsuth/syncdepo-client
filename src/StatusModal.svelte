<script>
  export let message;
  export let title;
</script>
<div class="modal" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{title}</h5>
      </div>
      <div class="modal-body">
        <img src="gears.gif" alt="gears turning" width="50px">
        {message}
      </div>
      <div class="modal-footer">
      </div>
    </div>
  </div>
</div>
<style>
.modal {
  display: block !important;
  background-color: rgba(0,0,0,.4) !important;
}
.modal-content {
  background-color: white !important;
}
</style>