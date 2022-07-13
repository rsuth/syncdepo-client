<script>
  import { toHMS } from "./utils.js";
  import {createEventDispatcher} from 'svelte';
  const dispatch = createEventDispatcher();
  export let currentlyOpenSync;
  const handleChangeMediaPath = () => {
    window.api.ChooseMediaFileDialog(currentlyOpenSync.media_path).then((p) => {
      if (p) {
        dispatch('new-video-path', { newPath: p[0] });
      }
    });
  };
</script>

<div id="depo-info-container" class="p-3">
  <h5>
    Witness: {currentlyOpenSync.first_name}
    {currentlyOpenSync.last_name}
  </h5>

  <p>Taken: {currentlyOpenSync.date}</p>
  <p>Running Time: {toHMS(currentlyOpenSync.duration)}</p>
  <p>
    Media Path:
    <div class="icon-on-hover"> 
      <small>
        <!-- svelte-ignore a11y-invalid-attribute -->
        <a on:click={handleChangeMediaPath} href="#">
          {currentlyOpenSync.media_path}
        </a>
        <img src="edit.png" alt="edit icon" width="14px">
      </small>
    </div>
</div>

<style>
  p {
    margin-bottom: 2px;
  }
  .icon-on-hover img {
    visibility: hidden;
  }
  .icon-on-hover:hover img{
    visibility: visible;
  }
</style>
