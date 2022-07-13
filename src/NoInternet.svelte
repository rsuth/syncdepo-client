<script>
    export let connectionError;
</script>

<div id="back-cover">
    <div class="h-100 d-flex align-items-center justify-content-center">
        <div class="middle-box">
            <h5>There was an error connecting to the deposync server:</h5>
            <div class="alert alert-danger">{connectionError}</div>
        </div>
    </div>
</div>

<style>
    #back-cover {
        height: 100vh;
        background-color: #22223b;
    }
</style>
