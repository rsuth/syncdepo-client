<script>
  import { createEventDispatcher } from "svelte";
  import { currentLineIndex, footerMessage } from "./stores.js";
  import { roundToHundredth } from "./utils";

  let dispatch = createEventDispatcher();

  export let videoPath;
  let videoInput;
  export let needVideo = false;
  export let manualMode;
  export let currentLine;
  let paused = true;
  let player;
  let currentTime = 0;
  let videoErr;

  // reactive function that happens when we cross the line's end
  $: {
    if (currentLine) {
      if (currentTime > currentLine.end) {
        if (!manualMode) {
          currentLineIndex.update((n) => n + 1);
        }
      }
    }
  }

  export function getCurrentTime() {
    return currentTime;
  }

  export function playPause() {
    if(player){
      if(paused){
        player.play();
      } else {
        player.pause();
      }
    }
  }

  window.api
    .CheckFileExists(videoPath)
    .then((exists) => {
      needVideo = !exists;
    })
    .catch((err) => {
      needVideo = true;
    });

  export function seekToTime(time) {
    currentTime = time;
  }
</script>

<div class="w-100 mb-2" style="background-color: black; max-width: 450px!important">
  <div id="video-container">
    {#if !needVideo}
      {#if videoErr}
      <div class="alert alert-danger" role="alert">
        Video Error: {player.error.message}
      </div>
      {/if}
      <video
        bind:currentTime
        bind:paused
        bind:this={player}
        on:seeked={() =>
          dispatch("video-seeked", { time: roundToHundredth(currentTime) })}
        id="videoEL"
        width="100%"
        src={videoPath}
        controls
      >
        <track kind="captions" />
      </video>
    {:else}
    <div class="alert alert-danger" role="alert">
      Missing Video File!
      <input
        bind:this={videoInput}
        type="file"
        accept="audio/*,video/*"

        on:change={() => {
          videoPath = videoInput.files[0].path;
          needVideo = false;
          dispatch("new-video-path", { newPath: videoPath });
          footerMessage.set(`Loaded video: ${videoPath}`);
        }}
      />
      </div>
    {/if}
  </div>
  <div id="waveform" />
</div>

<style>
  #video-container {
    max-width: 450px;

  }
</style>
