<script>
  import DepoInfo from "./DepoInfo.svelte";
  import VirtualList from "svelte-virtual-list-ce";
  import DepoLine from "./DepoLine.svelte";
  import VideoPlayer from "./VideoPlayer.svelte";
  import EditorMenu from "./EditorMenu.svelte";
  import { currentLineIndex, footerMessage } from "./stores.js";
  import hotkeys from "hotkeys-js";
  import { onMount } from "svelte";
  import LineAdjuster from "./LineAdjuster.svelte";

  export let currentlyOpenSync;
  export let currentOpenFilePath;
  let currentLine;
  let scrollStart;
  let scrollEnd;
  let scrollToIndex;
  let videoPlayerComponent;
  let manualMode = false;
  let needVideo;

  const SCROLL_OFFSET = 5;

  const punchInNextLine = () => {
    if (videoPlayerComponent) {
      let t = videoPlayerComponent.getCurrentTime();
      console.log("punch in next line");
      console.log(t);
      currentlyOpenSync.lines[currentLine].end = t - 0.01;
      currentlyOpenSync.lines[currentLine + 1].start = t;
      saveSync();
      currentLine++;
    }
  };

  const saveSync = async () => {
    await window.api.SaveResultOverwrite(
      JSON.stringify(currentlyOpenSync),
      currentOpenFilePath
    );
    footerMessage.set(`Sync file saved: ${currentOpenFilePath}`);
  };

  // initialize store when editor starts:
  currentLineIndex.set(0);

  const handleLineClicked = (event) => {
    currentLineIndex.set(event.detail.index);
    if (videoPlayerComponent) {
      videoPlayerComponent.seekToTime(
        currentlyOpenSync.lines[event.detail.index].start
      );
    }
  };

  const handleVideoSeek = (event) => {
    if (!manualMode) {
      if (event.detail.time > 0) {
        // create array of just start times to call findIndex on
        let startTimes = currentlyOpenSync.lines.map((line) => line.start);

        // find the first start time that is greater than the seek to time.
        // then we know that the time is within the line before that line.
        let index =
          startTimes.findIndex((time) => {
            return time > event.detail.time;
          }) - 1;
        if (index < 0) {
          currentLineIndex.set(currentlyOpenSync.lines.length - 1);
        } else {
          currentLineIndex.set(index);
        }
      } else {
        // we seeked to 0.
        currentLineIndex.set(0);
      }
      if (
        currentLine > scrollEnd - SCROLL_OFFSET ||
        currentLine < scrollStart
      ) {
        scrollToIndex(currentLine);
      }
    } else {
      return;
    }
  };

  const handleAdjustCurrentLineStart = async (event) => {
    let amount = event.detail.amount;
    let prevLineStart;
    if (currentlyOpenSync.lines[currentLine]) {
      let newTime = currentlyOpenSync.lines[currentLine].start + amount;

      // these are the bounds. we don't want to be able to make out of order lines.
      if (currentlyOpenSync.lines[currentLine - 1]) {
        prevLineStart = currentlyOpenSync.lines[currentLine - 1].start;
      } else {
        prevLineStart = 0;
      }
      let currentLineEnd = currentlyOpenSync.lines[currentLine].end;

      if (prevLineStart < newTime && newTime < currentLineEnd) {
        if (newTime > 0) {
          currentlyOpenSync.lines[currentLine].start = newTime;
          currentlyOpenSync.lines[currentLine - 1].end = newTime - 0.01;
          saveSync();
        }
      }

      videoPlayerComponent.seekToTime(
        currentlyOpenSync.lines[currentLine].start
      );
    }
  };

  const handleNewVideoPath = (event) => {
    currentlyOpenSync.media_path = event.detail.newPath;
    saveSync();
  };

  onMount(() => {
    hotkeys("space", (event, handler) => {
      event.preventDefault();
      if (videoPlayerComponent) {
        videoPlayerComponent.playPause();
      }
    });

    hotkeys(".", (event, handler) => {
      if (manualMode) {
        event.preventDefault();
        punchInNextLine();
      }
    });

    hotkeys("up", (event, handler) => {
      event.preventDefault();
      if (currentLine > 0) {
        handleLineClicked({ detail: { index: currentLine - 1 } });
      }
    });

    hotkeys("down", (event, handler) => {
      event.preventDefault();
      if (currentLine < currentlyOpenSync.lines.length - 2) {
        handleLineClicked({ detail: { index: currentLine + 1 } });
      }
    });

    // current Line index is a store because it can
    // be changed in VideoPlayer, when the time crosses the
    // current lines end time.
    currentLineIndex.subscribe((value) => {
      currentLine = value;
      if (
        currentLine > scrollEnd - SCROLL_OFFSET ||
        currentLine < scrollStart
      ) {
        scrollToIndex(currentLine - 1);
      }
    });
  });
</script>

<div id="editor" class="h-100 d-flex container-fluid justify-content-center">
  <div class="d-flex flex-column align-items-center" id="leftside">
    <DepoInfo {currentlyOpenSync} on:new-video-path={handleNewVideoPath} />
    {#if !needVideo}
      <EditorMenu
        bind:manualMode
        {currentlyOpenSync}
        currentLineStart={currentlyOpenSync.lines[currentLine]
          ? currentlyOpenSync.lines[currentLine].start
          : 0}
      />
    {/if}
    <VideoPlayer
      bind:this={videoPlayerComponent}
      bind:needVideo
      videoPath={currentlyOpenSync.media_path}
      currentLine={currentlyOpenSync.lines[currentLine]}
      {manualMode}
      on:video-seeked={handleVideoSeek}
      on:new-video-path={handleNewVideoPath}
    />
    <LineAdjuster
      bind:manualMode
      currentLineStart={currentlyOpenSync.lines[currentLine]
        ? currentlyOpenSync.lines[currentLine].start
        : 0}
      on:adjust-current-line-start={handleAdjustCurrentLineStart}
    />
  </div>
  <div id="lines-container">
    <VirtualList
      bind:scrollToIndex
      itemHeight={25}
      items={currentlyOpenSync.lines}
      let:item
      bind:start={scrollStart}
      bind:end={scrollEnd}
    >
      <DepoLine
        line_id={item.id}
        audio={item.audio}
        text={item.text}
        page_number={item.page_number}
        line_number={item.line_number}
        start={item.start}
        selected={currentLine === item.id}
        selectedColor={manualMode ? "#F9C28A" : "#fff45f"}
        on:line-clicked={handleLineClicked}
        on:new-video-path={handleNewVideoPath}
      />
    </VirtualList>
  </div>
</div>

<style>
  #lines-container {
    height: 100%;
    width: 100%;
    max-width: 925px;
    margin-left: 15px;
    background-color: #ffffff;
    overflow-x: hidden;
  }
</style>
