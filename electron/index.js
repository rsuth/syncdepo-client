const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { AUTH_SERVER_BASE_URL, API_SERVER_BASE_URL } = require('./config');
const { join, dirname } = require('path');
const ffmpegStatic = require('ffmpeg-static-electron');
const ffmpeg = require('fluent-ffmpeg');
const log = require('electron-log');

const { autoUpdater } = require("electron-updater");

app.on("ready", () => {
  autoUpdater.checkForUpdatesAndNotify();
});

log.info('starting syncdepo client');

const ffmpegStaticPath = ffmpegStatic.path.replace(
  'app.asar',
  'app.asar.unpacked'
);

const { buildViewer } = require('./viewer.js')

ffmpeg.setFfmpegPath(ffmpegStaticPath);

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const Store = require('electron-store');

const localStore = new Store();

const isDev = !app.isPackaged;
let window;

if (!localStore.get('syncfolder')) {
  // set the sync folder to be in the users documents.
  localStore.set('syncfolder', join(app.getPath('documents'), 'SyncDepo', 'SyncFiles'));
}

app.on('open-file', (event, path) => {
  event.preventDefault();
  loadSyncFile(event, path);
})

// create the sync files directory if it does not exist
ensureDirectoryExistence(localStore.get('syncfolder'));

app.whenReady().then(main);

function main() {
  window = new BrowserWindow({
    width: 1200, height: 960, show: false,
    minHeight: 540,
    minWidth: 980,
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, "./preload.js"),
    }
  });
  window.loadFile(join(__dirname, "../public/index.html"));
  window.removeMenu();
  window.on('ready-to-show', window.show);
  if (isDev) window.webContents.openDevTools();
}

ipcMain.handle("get/accessToken", async () => {
  return localStore.get('accessToken');
});

ipcMain.handle("get/refreshToken", async () => {
  return localStore.get('refreshToken');
});

ipcMain.handle("set/accessToken", async (event, t) => {
  if (!t) {
    localStore.delete('accessToken');
  } else {
    localStore.set('accessToken', t);
  }
})

ipcMain.handle("set/refreshToken", async (event, t) => {
  if (!t) {
    localStore.delete('refreshToken');
  } else {
    localStore.set('refreshToken', t);
  }
})

ipcMain.handle("ffmpeg/makewav", async (event, videoPath) => {
  return convertVideoToWav(videoPath);
});

ipcMain.handle("saveResult", async (event, result) => {
  let p;
  if (!path) {
    p = join(localStore.get('syncfolder'), result.job_id + ".syncd");
  } else {
    p = path;
  }
  ensureDirectoryExistence(p);
  console.log('writing result to: ' + p);
  try {
    await fs.promises.writeFile(p, JSON.stringify(result), { flag: "wx" });
    return p;
  } catch (err) {
    if (err.code === 'EEXIST') {
      return err.path;
    } else {
      throw Error(err);
    }
  }
});

ipcMain.handle("saveResultOverwrite", async (event, result, path) => {
  let p;
  if (!path) {
    p = join(localStore.get('syncfolder'), result.job_id + ".syncd");
  } else {
    p = path;
  }
  ensureDirectoryExistence(p);
  console.log('writing result to: ' + p);
  try {
    await fs.promises.writeFile(p, result);
    return p;
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
});

ipcMain.handle("openSyncFileDialog", () => {
  let options = {
    title: "Open Sync File",
    defaultPath: localStore.get('syncfolder'),
    filters: [{ name: 'SyncDepo Files', extensions: ["syncd", "json"] }],
  }
  return dialog.showOpenDialogSync(window, options);
});

ipcMain.handle("chooseMediaFileDialog", (event, currentPath) => {
  let = options = {
    title: "Change Media Path",
    defaultPath: currentPath,
    filters: [{ name: 'Media Files', extensions: ["mp4", "mp3", "wav", "wmv", "mpg"] }]
  }
  return dialog.showOpenDialogSync(window, options);
});

ipcMain.handle("saveSyncFileDialog", (event, defaultName) => {
  let options = {
    title: "Save Sync File",
    defaultPath: join(localStore.get('syncfolder'), defaultName),
    filters: [{ name: 'SyncDepo Files', extensions: ["syncd"] }],
  }
  return dialog.showSaveDialogSync(window, options);
});

ipcMain.handle("chooseViewerPackageFolderDialog", (event) => {
  let options = {
    title: "Save Viewer Package",
    defaultPath: join(app.getPath('desktop')),
    properties: ["openDirectory", "createDirectory"]
  }
  return dialog.showOpenDialogSync(window, options);
});

ipcMain.handle("exportViewerPackage", (event, saveFolder, mediaSource, dep, xml, srt) => {
  console.log(`export viewer package to ${saveFolder}, copy from ${mediaSource}, rootname: ${dep.rootName}`);
  // make folder and copy media
  let mediaDir = join(saveFolder, dep.rootName, 'media');
  let importDir = join(saveFolder, dep.rootName, 'import')
  if (!fs.existsSync(mediaDir) || !fs.existsSync(importDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
    fs.mkdirSync(importDir, { recursive: true });
    fs.copyFile(mediaSource, join(mediaDir, dep.rootName + ".mp4"), (err) => {
      if (err) {
        console.log(err);
        return;
      }
      fs.writeFileSync(join(saveFolder, dep.rootName, dep.rootName + ".html"), buildViewer(dep));
      fs.writeFileSync(join(importDir, dep.rootName + ".xml"), xml);
      fs.writeFileSync(join(importDir, dep.rootName + ".srt"), srt);
      shell.openPath(join(saveFolder, dep.rootName));
    });
  }
  return;
});

ipcMain.handle("saveExportFileDialog", (event, defaultName) => {
  let filefilters;

  if (defaultName.includes('.srt')) {
    filefilters = [{ name: 'Subtitle Files', extensions: [".srt"] }];
  } else if (defaultName.includes('.xml')) {
    filefilters = [{ name: 'Oncue Sync File', extensions: [".xml"] }];
  } else {
    filefilters = [{ name: 'All Files', extensions: ["*"] }];
  }

  let options = {
    title: "Save Sync File",
    defaultPath: join(app.getPath('desktop'), defaultName),
    filters: filefilters,
  }

  return dialog.showSaveDialogSync(window, options);
});


const loadSyncFile = async (event, path) => {
  try {
    let content = await fs.promises.readFile(path);
    let recents = localStore.get('recentFiles');
    if (recents) {
      if (!recents.includes(path)) {
        if (recents.length > 5) {
          recents.shift();
        }
        localStore.set('recentFiles', recents.concat(path));
      }
    } else {
      localStore.set('recentFiles', [path])
    }

    return JSON.parse(content);
  } catch (err) {
    throw new Error(err);
  }
}

ipcMain.handle("loadSyncFile", loadSyncFile);

ipcMain.handle("checkFileExists", async (event, path) => {
  if (path) {
    try {
      await fs.promises.access(path)
      return true;
    } catch (e) {
      return false;
    }
  } else {
    return false;
  }
});

ipcMain.handle('getRecentFiles', (event) => {
  let recents = localStore.get('recentFiles');
  if (recents) {
    return recents.reverse();
  } else {
    return [];
  }
});

ipcMain.handle("sendJob", async (event, job) => {
  var res;
  try {
    res = await sendJob(event, job);
  } catch (err) {
    console.log(err);
    res = err;
  }
  return res;
});

async function getNewToken() {
  console.log('getting new access token');
  let refreshToken = localStore.get('refreshToken');
  let response = await axios.post(AUTH_SERVER_BASE_URL + "/token", {}, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + refreshToken
    }
  });
  localStore.set('accessToken', response.data.accessToken);
  console.log('got new access token');
  return {
    success: true,
    accessToken: response.data.accessToken
  }
}

async function sendJob(event, job) {
  console.log('sending job to ' + API_SERVER_BASE_URL + "/jobs");
  log.info('New Job - sending to syncdepo server');
  // would really like to do this in the render process
  // but its working
  const wavFile = fs.createReadStream(job.wavPath);
  const txtFile = fs.createReadStream(job.txtPath);
  let fd = new FormData();
  fd.append('first_name', job.firstName);
  fd.append('last_name', job.lastName);
  fd.append('middle_initial', job.middleInitial);
  fd.append('date_taken', job.date);
  fd.append('start_page', job.startPg);
  fd.append('user_media_path', job.userMediaPath);
  fd.append('lines_per_page', job.linesPerPage);
  fd.append('mediaFileSize', job.mediaFileSize);
  fd.append('media', wavFile, "a.wav");
  fd.append('txt', txtFile, "t.txt");

  try {
    let response = await axios.post(API_SERVER_BASE_URL + "/jobs", fd, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        ...fd.getHeaders(),
        "Authorization": "Bearer " + localStore.get('accessToken'),
      }
    });
    console.log('response: ', response.data);
    return response.data;

  } catch (err) {
    log.error('Error sending job to syncdepo server', err.response.data);
    if (err.response.status === 401) {
      console.log('got 401, getting new access token');
      // token probably expired - try to refresh
      try {
        await getNewToken();
        return await sendJob(event, job);
      } catch (err) {
        console.log('failed to get new access token');
        // error refreshing token
        return err.response.data;
      }
    }
    console.log('error sending job - Status: ' + err.response.status);
    // if we get here, it wasnt a 401 - just return the error
    // TODO: handle 403 - not enough credits? Or just deal with it on the client
    return err.response.data;
  }
}

ipcMain.handle('quitApplication', () => {
  app.exit(0);
})

ipcMain.handle('openExternalURL', (event, url) => {
  shell.openExternal(url);
  return;
})

function convertVideoToWav(videoPath) {
  log.info(
    `converting video to wav: ${videoPath}`
  )
  let wavPath = join(app.getPath('temp'), 'a.wav');
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioFrequency(8000)
      .audioChannels(1)
      .on('start', (cl) => {
        console.log('starting ffmpeg: ' + cl);
      })
      .on('end', () => {
        resolve(wavPath);
      })
      .on('error', (err, stdout, stderr) => {
        console.log('ffmpeg error: ' + err)
        reject(err);
      })
      .save(wavPath);
  })
}

function ensureDirectoryExistence(filePath) {
  var dirName = dirname(filePath);
  if (fs.existsSync(dirName)) {
    return true;
  }
  ensureDirectoryExistence(dirName);
  fs.mkdirSync(dirName);
}

