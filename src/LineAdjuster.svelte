<script>
    import { createEventDispatcher } from "svelte";
    import {toHMS} from './utils';

    const dispatch = createEventDispatcher();
    
    export let currentLineStart;
    export let manualMode;
    
    const handleAdjustLine = (amount) => {
        dispatch("adjust-current-line-start", { amount: amount });
    };
</script>

<div
    class="w-100 d-flex align-items-center justify-content-center"
    style="max-width: 450px;!important; padding:5px; border: 1px solid grey"
>
    <button
        on:click={() => {
            handleAdjustLine(-5);
        }}
        disabled={manualMode}
        class="adjustment-control-btn btn btn-danger">-5s</button
    >
    <button
        on:click={() => {
            handleAdjustLine(-1);
        }}
        disabled={manualMode}
        class="adjustment-control-btn btn btn-danger ms-1">-1s</button
    >
    <button
        on:click={() => {
            handleAdjustLine(-0.1);
        }}
        disabled={manualMode}
        class="adjustment-control-btn btn btn-danger ms-1 me-auto"
        >-.1s</button
    >
    <span id="current-line-start">{toHMS(currentLineStart)}</span
    >
    <button
        on:click={() => {
            handleAdjustLine(0.1);
        }}
        disabled={manualMode}
        class="adjustment-control-btn btn btn-success ms-auto"
        >+.1s</button
    >
    <button
        on:click={() => {
            handleAdjustLine(1);
        }}
        disabled={manualMode}
        class="adjustment-control-btn btn btn-success ms-1">+1s</button
    >
    <button
        on:click={() => {
            handleAdjustLine(5);
        }}
        disabled={manualMode}
        class="adjustment-control-btn btn btn-success ms-1">+5s</button
    >
</div>

<style>
    button {
        font-size: 10pt;
    }
    #current-line-start {
        font-family: "Courier New", Courier, monospace;
        font-size: 18px;
        font-weight: 600;
        margin: 0px 5px;
    }

</style>
