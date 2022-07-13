<script>
  import {
    fetchWithToken,
    buildDefaultName,
    prettyFormatDateTimeStr,
  } from "./utils";
  import { createEventDispatcher, onMount } from "svelte";
  import { footerMessage } from "./stores.js";
  import { onDestroy } from "svelte";
  import StatusModal from "./StatusModal.svelte";
  import ConfirmDialogModal from "./ConfirmDialogModal.svelte";
  import { API_SERVER_BASE_URL } from "./config";

  const dispatch = createEventDispatcher();

  let jobs = [];
  let allDone = true;
  let pollTimeout;
  let showModal = false;
  let modalMessage = "";
  let showDeleteConfirmModal = false;
  let jobToDelete;

  export let stopPolling = false;
  // how often to check the jobs
  const pollingIntervalMS = 5000;

  const handleDownloadBtnClicked = (job_id) => {
    let url = `${API_SERVER_BASE_URL}/jobs/${job_id}/result`;
    showModal = true;
    modalMessage = "Downloading Sync File";
    fetchWithToken(url, "GET")
      .then((data) => {
        if (data.error) {
          if (data.status === 401) {
            dispatch("goto-login");
            return;
          } else {
            console.log(data.error);
            return;
          }
        }

        let defaultName = buildDefaultName(data, ".syncd");

        window.api.SaveSyncFileDialog(defaultName).then((savePath) => {
          if (savePath) {
            window.api
              .SaveResultOverwrite(JSON.stringify(data), savePath)
              .then((loadPath) => {
                dispatch("load-sync", { path: loadPath });
              });
          } else {
            showModal = false;
            modalMessage = "";
          }
        });
      })
      .catch((err) => {
        console.log(err);
        dispatch("goto-login");
      });
  };

  const handleDeleteBtnClicked = (job_id) => {
    showDeleteConfirmModal = true;
    jobToDelete = job_id;
    return;
  };

  const handleDelete = () => {
    let url = `${API_SERVER_BASE_URL}/jobs/${jobToDelete}/delete`;
    fetchWithToken(url, "GET")
      .then((data) => {
        if (data.error) {
          console.log(data.error);
          if (data.status === 401) {
            dispatch("goto-login");
            return;
          }
        }
        jobs = data;
        return;
      })
      .catch((err) => {
        console.log(err);
        dispatch("goto-login");
      });
  };

  const pollStatus = (ms) => {
    if (!stopPolling) {
      footerMessage.set("Refreshing Queue...");
      // get list of jobs and statuses
      fetchWithToken(`${API_SERVER_BASE_URL}/jobs`, "GET")
        .then((data) => {
          if (data.error) {
            if (data.status === 401) {
              dispatch("goto-login");
              return;
            } else {
              console.log(data.error);
              footerMessage.set(
                "Error refreshing queue: " + data.error.message
              );
              return;
            }
          }
          footerMessage.set(`[${new Date().toUTCString()}] Queue Refreshed`);
          jobs = data || [];
          allDone = true;
          // check to see if the jobs are all done
          for (let i = 0; i < jobs.length; i++) {
            if (jobs[i].status !== "done") {
              allDone = false;
            }
          }
          // if jobs are all done, clear the timeout (stop polling).
          if (allDone) {
            stopPolling = true;
            return;
          } else {
            // execute this function again after waiting <ms> miliseconds.
            pollTimeout = setTimeout(() => pollStatus(ms), ms);
          }
        })
        .catch((err) => {
          console.log(err);
          dispatch("goto-login");
        });
    } else {
      return;
    }
  };

  onMount(() => {
    pollStatus(pollingIntervalMS);
  });
  onDestroy(() => {
    stopPolling = true;
    clearTimeout(pollTimeout);
  });
</script>

{#if showModal}
  <StatusModal message={modalMessage} title="" />
{/if}
{#if showDeleteConfirmModal}
  <ConfirmDialogModal
    title="Delete Sync"
    bodyMsg="Are you sure you want to delete?"
    yesMsg="Delete"
    noMsg="Cancel"
    on:submitted={(event) => {
      if (event.detail.confirmed) {
        handleDelete();
        showDeleteConfirmModal = false;
        jobToDelete = undefined;
      } else {
        showDeleteConfirmModal = false;
        jobToDelete = undefined;
      }
    }}
  />
{/if}
<div
  class="d-flex h-100 flex-column align-items-center"
  style="background-color: white"
>
  <div style="overflow-y:scroll;background-color: white; width:97%">
    <table class="table table-sm">
      <thead>
        <tr height="50px">
          <th scope="col">Job Id</th>
          <th scope="col">Deponent</th>
          <th scope="col">Depo Date</th>
          <th scope="col">Runtime</th>
          <th scope="col">Submitted</th>
          <th scope="col">Completed</th>
          <th scope="col">Status</th>
          <th scode="col" />
        </tr>
      </thead>
      <tbody>
        {#each jobs as job}
          <tr class="align-middle">
            <td style="min-width: 95px"><small>{job.job_id}</small></td>
            <td style="width: 100%">{job.last_name + ", " + job.first_name}</td>
            <td style="min-width: 100px">{job.date_taken}</td>
            <td style="min-width: 95px"
              >{`${Math.round(job.duration / 60)}m`}</td
            >
            <td style="min-width: 100px"
              ><small>{prettyFormatDateTimeStr(job.submitted)}</small></td
            >
            <td style="min-width: 100px"
              ><small
                >{job.completed
                  ? prettyFormatDateTimeStr(job.completed)
                  : "-"}</small
              ></td
            >
            <td style="min-width: 110px">
              {#if job.status !== "done"}
                <img height="16px" src="gears.gif" alt="loading" />
              {/if}
              {job.status === "done" ? "Complete" : job.status}
            </td>
            <td class="job-actions" style="text-align: right; min-width: 200px">
              <div id="actions">
                {#if job.status === "done"}
                  <button
                    class="btn btn-outline-secondary m-1"
                    on:click={() => {
                      handleDownloadBtnClicked(job.job_id);
                    }}
                  >
                    <img src="dl.png" alt="download" width="20px" />
                    Download
                  </button>
                {/if}
                <button
                  class="btn btn-outline-danger m-1"
                  on:click={() => {
                    handleDeleteBtnClicked(job.job_id);
                  }}
                >
                  {job.status === "done" ? "Delete" : "Cancel"}
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  thead {
    position: sticky;
    top: 0;
    background-color: white;
  }
  tbody {
    overflow-y: scroll;
  }
  table {
    font-size: 16px;
  }
  .btn {
    font-size: 16px;
    padding: 4px;
  }
</style>
