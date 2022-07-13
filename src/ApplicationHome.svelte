<script>
  import { createEventDispatcher } from "svelte";

  export let currentUser;
  const dispatch = createEventDispatcher();
  let recentFiles = [];

  const shortenFilePath = (p) => {
    return ".../" + p.split(/[\\/]/).slice(-3).join("/");
  };

  window.api.GetRecentFiles().then((paths) => {
    recentFiles = paths;
  });
</script>

<div id="back-cover">
  {#if !currentUser}
    <div class="d-flex align-items-end" style="grid-area: header; ">
      <div
        class="alert alert-warning mb-5"
        style="text-align: center; padding: 5px; width: 100%;"
      >
        You are currently using SyncDepo in Offline Mode. Some features are
        disabled.
      </div>
    </div>
  {/if}
  <div style="grid-area: title;" class="d-flex flex-column justify-content-end mb-4">
    <img src="logo.png" alt="sink logo" height="100px" width="100px" class="me-2"/>
    <h1 style="margin-top: 0.7rem; margin-bottom: 0px">SyncDepo</h1>
  </div>
  <div class="d-flex flex-column" style="grid-area: left-column; max-width: 300px;">
    <div class="d-flex flex-column">
      <h5>Get Started:</h5>
      <!-- svelte-ignore a11y-missing-attribute -->
      <button
        class="btn"
        on:click={() => {
          dispatch("goto-new-sync");
        }}
        disabled={!currentUser}
      >
        <img src="plus.png" alt="folder" width="20px" />
        New Sync
      </button>
      <!-- svelte-ignore a11y-missing-attribute -->
      <button
        class="btn"
        on:click={() => {
          dispatch("open-sync-file");
        }}
      >
        <img src="folder.svg" alt="folder" width="20px" />
        Open Sync File</button
      >
      <!-- svelte-ignore a11y-missing-attribute -->
      <button
        class="btn"
        on:click={() => {
          dispatch("goto-jobs-table");
        }}
        disabled={!currentUser}
      >
        <img src="q.png" alt="folder" width="20px" />
        My Sync Queue
      </button>
      <!-- svelte-ignore a11y-missing-attribute-->
      <button
        class="btn"
        on:click={() => {
          window.api.QuitApplication();
        }}
        ><img src="exit.png" alt="x" width="20px" />
        Quit Application
      </button>
    </div>
  </div>
  <div
    class="d-flex flex-column"
    style="grid-area: right-column; max-width: 300px;"
  >
    <h5>Recent files:</h5>
    {#each recentFiles as p}
      <!-- svelte-ignore a11y-missing-attribute -->
      <a
        class="link-light recent"
        on:click={() => {
          dispatch("load-sync", { path: p });
        }}
      >
        {shortenFilePath(p)}
      </a>
    {/each}
  </div>
</div>

<style>
  #back-cover {
    display: grid;
    grid-template-rows: 100px auto 1fr 100px;
    grid-template-columns: 3fr auto 75px auto 3fr;
    height: 100%;
    background-color: #22223b;
    color: #fffbff;
    grid-template-areas:
      ".  header header header ."
      ". title title title ."
      ". left-column . right-column ."
      ". footer footer footer .";
  }
  .btn {
    color: #fffbff;
    text-decoration: none;
    text-align: left;
    padding-left: 0px;
  }
  .recent {
    color: #4d9de0;
  }
  a {
    text-decoration: none;
  }
  a:hover {
    color: #8e8e8e;
    cursor: pointer;
  }
  .btn:hover {
    color: #8e8e8e;
    cursor: pointer;
  }
  h5 {
    color: rgb(184, 184, 184);
  }
  img {
    vertical-align: text-top;
  }
  h1 {
    font-weight: 700;
  }
</style>
