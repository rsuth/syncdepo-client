<script>
  import { createEventDispatcher } from "svelte";
  import StatusModal from "./StatusModal.svelte";
  import { findWitnessName, findNonAscii, ingestTxtFile } from "./utils";

  const dispatch = createEventDispatcher();

  let error;
  let mediaFile;
  let txtFile;
  let wavPath;
  let startPg = 1;
  let firstName;
  let lastName;
  let middleInitial = "";
  let date;
  let state = "Waiting";
  let txtContent;
  let linesPerPage = 25;
  let uploadPercentage = 0;
  let mediaFileSize = 0;

  const handleTxtFileSelection = (e) => {
    error = "";
    txtFile = e.target.files[0];
    ingestTxtFile(txtFile)
      .then((content) => {
        if (findNonAscii(content).length > 0) {
          error =
            "TXT file contains non-ASCII characters. Please remove them and try again.";
          e.target.value = null;
        } else {
          txtContent = content;
          if (findWitnessName(txtContent)) {
            firstName = findWitnessName(txtContent).first;
            lastName = findWitnessName(txtContent).last;
          }
        }
      })
      .catch((err) => {
        error = "Error reading text file.";
        e.target.value = null;
      });
  };

  const submitBtnPressed = async (event) => {
    error = "";
    state = "Processing...";
    if (mediaFile && mediaFile[0]) {
      mediaFileSize = mediaFile[0].size;
      try {
        wavPath = await window.api.ConvertToWav(mediaFile[0].path);
      } catch (err) {
        error = "Error converting media file";
        state = "Waiting";
      }
      state = "Uploading...";
      try {
        let sendJobResponse = await sendJob();
        if (sendJobResponse.detail.error) {
          error = sendJobResponse.detail.error.message;
          state = "Waiting";
        } else {
          dispatch("goto-jobs-table");
        }
      } catch (err) {
        error = err;
        console.log(err);
        state = "Waiting";
      }
    }
  };

  const sendJob = () => {
    let job = {};
    job.wavPath = wavPath;
    job.txtPath = txtFile.path;
    job.firstName = firstName;
    job.lastName = lastName;
    job.middleInitial = middleInitial;
    job.date = date;
    job.startPg = startPg;
    job.userMediaPath = mediaFile[0].path;
    job.linesPerPage = linesPerPage;
    job.mediaFileSize = mediaFileSize;
    return window.api.SendJob(job);
  };
</script>

{#if state !== "Waiting" && state !== "Error"}
  <StatusModal message={state} title="New Sync" />
{/if}
<div class="d-flex h-100 w-100 align-items-center justify-content-center">
  <div class="d-flex flex-column ms-5 col-md-4">
    <h1>New Sync</h1>
    <hr />
    {#if error}
      <div class="alert alert-danger" role="alert">
        {error}
      </div>
    {/if}
    <p>
      Syncdepo accepts standard legal transcripts in ASCII format. Lines should
      be numbered, and any extra information in margins (timestamps, etc.) must
      be removed.
    </p>
    <form
      enctype="multipart/form-data"
      id="uploadform"
      on:submit|preventDefault={submitBtnPressed}
    >
      <div class="d-grid gap-1">
        <div class="form-group">
          <label for="txtFileInput">Transcript File (.txt):</label>
          <input
            on:change={handleTxtFileSelection}
            type="file"
            id="txtFileInput"
            class="form-control"
            name="txt"
            accept=".txt"
            required
          />
        </div>
        <div class="input-group mt-3">
          <span class="input-group-text">Deponent Name: </span>
          <input
            bind:value={firstName}
            type="text"
            aria-label="First name"
            class="form-control"
            placeholder="First"
            name="firstName"
            required
          />
          <input
            bind:value={middleInitial}
            type="text"
            class="form-control"
            placeholder="MI"
            name="middleInitial"
          />
          <input
            bind:value={lastName}
            type="text"
            aria-label="Last name"
            class="form-control"
            placeholder="Last"
            name="lastName"
            required
          />
        </div>
        <div class="form-group">
          <label for="dateInput">Deposition Date: </label>
          <input
            bind:value={date}
            type="date"
            id="dateInput"
            class="form-control"
            name="dateTaken"
            style="width: 170px"
            required
          />
          <label for="startPgInput">First Page with Line Numbers: </label>
          <input
            bind:value={startPg}
            type="number"
            id="startPgInput"
            class="form-control"
            name="startPg"
            style="width: 170px"
            min="1"
            required
          />
          <label for="linesPerPgInput">Lines per Page: </label>
          <input
            bind:value={linesPerPage}
            type="number"
            id="linesPerPageInput"
            class="form-control"
            name="linesPerPage"
            style="width: 170px"
            min="1"
            required
          />
        </div>
        <div class="form-group">
          <label for="mediaFileInput">Video file (.mp4):</label>
          <input
            bind:files={mediaFile}
            ref="mediafile"
            type="file"
            id="mediaFileInput"
            class="form-control"
            name="media"
            accept=".mp3, .wav, .mp4"
            required
          />
        </div>
        <div class="d-flex w-100 justify-content-center">
          <button id="uploadbtn" type="submit" class="btn btn-primary">
            Upload and Sync
          </button>
          <button
            on:click={() => {
              dispatch("goto-home");
            }}
            class="btn btn-secondary ms-1"
          >
            Cancel
          </button>
        </div>
        {#if uploadPercentage > 0 && uploadPercentage < 100}
          <progress max="100" value={uploadPercentage} />
        {/if}
      </div>
    </form>
  </div>
  <div id="transcript-preview" class="h-100 d-flex ms-3 col-md-7">
    {#if !txtContent}
      <img
        on:click={() => {
          document.getElementById("txtFileInput").click();
        }}
        id="newdoc-icon"
        class="ms-auto me-auto align-self-center"
        src="newdoc.png"
        alt="document icon"
        height="50%"
      />
    {:else}
      <textarea wrap="soft" cols="80" class="align-self-center" readonly
        >{txtContent}</textarea
      >
    {/if}
  </div>
</div>

<style>
  #newdoc-icon {
    cursor: pointer;
  }

  textarea {
    height: 80%;
    font-family: "Courier New", Courier, monospace;
  }

  label {
    margin-top: 10px;
  }

  button {
    margin-top: 10px;
  }
</style>
