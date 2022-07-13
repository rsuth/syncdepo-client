<script>
  import { toHMS } from "./utils.js";
  import {createEventDispatcher} from "svelte";

  const dispatch = createEventDispatcher();

  export let line_id = 0;
  export let audio;
  export let text;
  export let page_number;
  export let line_number;
  export let start;
  export let selected;
  export let selectedColor;
</script>

<div
  class="line-container {audio ? '' : 'no-audio'}"
  style="background-color: {selected ? selectedColor : 'white'};"
  on:click={()=>{dispatch('line-clicked', {index: line_id})}}
>
  <div id="timestamp-start" class="timestamp">{toHMS(start)}</div>
  {#if line_number === 1}
    <div class="line-text">
      {page_number.toString().padStart(3, "0") + ":" + text.trim()}
    </div>
  {:else}
    <div class="line-text">{"       " + text.trim()}</div>
  {/if}
</div>

<style>    
.line-container {
  display:inline-grid;
  grid-template-columns: 120px;
  grid-template-areas: "timestamp-start linetext";
  width: 100%;
  line-height: 1.4em;
  height: 25px;
  cursor: pointer;
  user-select: none;
  border: 1px solid #ffffff;
}

.line-container:hover {
  border: 1px solid #728fee
}

.line-text {
  white-space: pre;
  grid-area: linetext;
  font-size: 1em;
  padding-left: 8px;
  border-left-color: #d7d7d7;
  border-left-width: 1px;
  border-left-style: solid;
}
.timestamp {
  font-family: 'Courier New', Courier, monospace;
  padding-left: 5px;
}
#timestamp-start {
  grid-area: timestamp-start;
}

.no-audio {
  opacity: 0.4;
}

</style>