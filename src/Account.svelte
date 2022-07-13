<script>
  import { createEventDispatcher } from "svelte";
  import { WEBSITE_BASE_URL } from "./config";
  const dispatch = createEventDispatcher();
  export let currentUser;
</script>

<div class="d-flex h-100 justify-content-center align-items-center">
  <div class="middle-box">
    <h1>My Account</h1>
    <button
      on:click={() => {
        window.api.OpenExternalURL(WEBSITE_BASE_URL + "/account-home");
      }}
      class="btn btn-link">Manage Account</button
    >
    <hr />
    <h3>{currentUser.email}</h3>
    <p>Current Balance: {currentUser.sync_hours} Sync hours</p>
    <button
      on:click={() => {
        dispatch("logout");
      }}
      class="btn btn-danger">Log Out</button
    >
  </div>
</div>

<style>
  .middle-box {
    width: 50%;
  }
</style>
