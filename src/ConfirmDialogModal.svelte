<script>
    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();
    export var bodyMsg;
    export var title;
    export var yesMsg;
    export var noMsg;

  </script>
  <div class="modal" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{title}</h5>
        </div>
        <div class="modal-body">
          <img src="gears.gif" alt="gears turning" width="50px">
          {bodyMsg}
        </div>
        <div class="modal-footer">
            <button class="btn btn-primary" on:click={()=>{
                dispatch('submitted', {confirmed: true});
            }}>
                {yesMsg}
            </button>
            <button class="btn btn-secondary" on:click={()=>{
                dispatch('submitted', {confirmed: false});
            }}>
                {noMsg}
            </button>
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