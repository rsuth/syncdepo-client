<script>
  import { loginGetTokens } from "./utils";
  import { createEventDispatcher } from "svelte";
  let error;
  let input = {
    email: "",
    password: "",
  };

  const dispatch = createEventDispatcher();

  const login = () => {
    loginGetTokens(input.email, input.password)
      .then((response) => {
        if (response.error) {
          console.log("error", response.error);
          error = { message: response.error };
        } else {
          dispatch("login-success");
        }
      })
      .catch((err) => {
        console.log(err);
        error = err;
      });
  };

  const useOffline = () => {
    dispatch("use-offline");
  };
</script>

<div id="back-cover">
  <div class="h-100 d-flex align-items-center justify-content-center">
    <div class="middle-box">
      <form id="login-form">
        <h1 class="text-center">Login</h1>
        {#if error}
          <div class="alert alert-danger" role="alert">
            {error.message}
          </div>
        {/if}
        <div class="form-group">
          <label for="emailInput">Email</label>
          <input
            id="emailInput"
            class="form-control"
            type="email"
            name="email"
            bind:value={input.email}
          />
        </div>
        <div class="form-group my-2">
          <label for="passwordInput">Password</label>
          <input
            id="passwordInput"
            class="form-control"
            type="password"
            name="password"
            bind:value={input.password}
          />
        </div>
        <div class="d-grid gap-1">
          <button class="btn btn-primary mt-1" type="button" on:click={login}
            >Log in</button
          >
          <button class="btn btn-link" on:click={useOffline}>
            Use in Offline Mode
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<style>
  #back-cover {
    height: 100vh;
    background-color: #22223b;
  }
  #login-form {
    min-width: 300px;
  }
</style>
