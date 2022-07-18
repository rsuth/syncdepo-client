<script>
  import {
    toHMS,
    createSRT,
    createOncueXML,
    buildDefaultName,
    createTimeStampTxt,
    createOpenDVTXML,
  } from "./utils";

  import { footerMessage } from "./stores";

  import Dropdown from "sv-bootstrap-dropdown";
  import StatusModal from "./StatusModal.svelte";

  export let manualMode;

  export let currentlyOpenSync;
  let dropdownTrigger;
  let showModal = false;
  let modalMessage = undefined;

  const handleViewerExport = () => {
    let dep = {
      name: currentlyOpenSync.first_name + " " + currentlyOpenSync.last_name,
      RT: toHMS(currentlyOpenSync.duration),
      date: currentlyOpenSync.date,
      mediaPath: "./media/" + buildDefaultName(currentlyOpenSync, ".mp4"),
      lines: currentlyOpenSync.lines,
      rootName: buildDefaultName(currentlyOpenSync, ""),
    };
    window.api.ChooseViewerPackageFolderDialog().then((saveFolder) => {
      if (saveFolder[0]) {
        let srt = createSRT(currentlyOpenSync);
        let xml = createOncueXML(currentlyOpenSync);

        window.api
          .ExportViewerPackage(
            saveFolder[0],
            currentlyOpenSync.media_path,
            dep,
            xml,
            srt
          )
          .then(() => {
            footerMessage.set("saved export package to " + saveFolder[0]);
          });
      }
    });
  };

  const handleExport = (type) => {
    showModal = true;
    let out;
    let ext;
    if (type === "srt") {
      modalMessage = "Creating SRT File...";
      out = createSRT(currentlyOpenSync);
      ext = ".srt";
    } else if (type === "oncue") {
      modalMessage = "Creating Oncue .xml File...";
      out = createOncueXML(currentlyOpenSync);
      ext = ".xml";
    } else if (type === "dvt") {
      modalMessage = "Creating OpenDVT File...";
      out = createOpenDVTXML(currentlyOpenSync);
      ext = ".dvt";
    } else if (type === "txt") {
      modalMessage = "Creating Timestamped text file...";
      out = createTimeStampTxt(currentlyOpenSync);
      ext = ".txt";
    } else {
      showModal = false;
      modalMessage = undefined;
      return;
    }
    if (out) {
      window.api
        .SaveExportFileDialog(buildDefaultName(currentlyOpenSync, ext))
        .then((savePath) => {
          if (savePath) {
            window.api
              .SaveResultOverwrite(out, savePath)
              .then((savePath) => {
                footerMessage.set(`saved ${savePath}`);
              })
              .then(() => {
                showModal = false;
                modalMessage = undefined;
              });
          } else {
            showModal = false;
            modalMessage = undefined;
            return;
          }
        });
    } else {
      showModal = false;
      modalMessage = undefined;
    }
  };
</script>

{#if showModal}
  <StatusModal message={modalMessage} title="" />
{/if}

<div
  class="w-100 d-flex justify-content-center mb-2"
  style="border: 1px solid grey; padding: 5px; max-width: 450px;!important;"
>
  <div>
    <Dropdown triggerElement={dropdownTrigger}>
      <button
        type="button"
        class="btn btn-primary dropdown-toggle"
        bind:this={dropdownTrigger}
      >
        Export Sync
      </button>
      <div slot="DropdownMenu">
        <!-- svelte-ignore a11y-missing-attribute -->
        <a
          on:click={() => {
            handleExport("srt");
          }}
          class="dropdown-item"
          type="button">Subtitle (.srt) File</a
        >
        <!-- svelte-ignore a11y-missing-attribute -->
        <a
          on:click={() => {
            handleExport("oncue");
          }}
          class="dropdown-item"
          type="button">Oncue (.xml) File</a
        >
        <!-- svelte-ignore a11y-missing-attribute -->
        <a
          on:click={() => {
            handleExport("dvt");
          }}
          class="dropdown-item"
          type="button">OpenDVT (.dvt) File</a
        >
        <!-- svelte-ignore a11y-missing-attribute -->
        <a
          on:click={() => {
            handleExport("txt");
          }}
          class="dropdown-item"
          type="button">Timestamped Plaintext (.txt) File</a
        >
        <!-- svelte-ignore a11y-missing-attribute -->
        <a
          on:click={() => {
            handleViewerExport();
          }}
          class="dropdown-item"
          type="button">Viewer</a
        >
      </div>
    </Dropdown>
  </div>
  <div class="d-flex align-items-center" style="height: 38px; margin:5px">
    <span style="margin-left: 50px; margin-right: 10px;line-height:34px;">
      Manual Mode:
    </span>
    <label class="switch">
      <input type="checkbox" bind:checked={manualMode} />
      <span class="slider round" />
    </label>
  </div>
</div>

<style>
  button {
    margin: 5px;
  }

  /* The switch - the box around the slider */
  .switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
  }

  /* Hide default HTML checkbox */
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  /* The slider */
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }

  input:checked + .slider {
    background-color: #f3a321;
  }

  input:focus + .slider {
    box-shadow: 0 0 1px #f3a321;
  }

  input:checked + .slider:before {
    -webkit-transform: translateX(26px);
    -ms-transform: translateX(26px);
    transform: translateX(26px);
  }

  /* Rounded sliders */
  .slider.round {
    border-radius: 34px;
  }

  .slider.round:before {
    border-radius: 50%;
  }
</style>
