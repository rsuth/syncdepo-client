const { ipcRenderer, contextBridge } = require('electron');

const WINDOW_API = {
  GetAccessToken: () => ipcRenderer.invoke("get/accessToken"),
  SetAccessToken: (token) => ipcRenderer.invoke("set/accessToken", token),
  GetRefreshToken: () => ipcRenderer.invoke("get/refreshToken"),
  SetRefreshToken: (token) => ipcRenderer.invoke("set/refreshToken", token),
  ConvertToWav: (videoPath) => ipcRenderer.invoke("ffmpeg/makewav", videoPath),
  SendJob: (job) => ipcRenderer.invoke("sendJob", job),
  SaveResult: (result, path) => ipcRenderer.invoke('saveResult', result, path),
  SaveResultOverwrite: (result, path) => ipcRenderer.invoke('saveResultOverwrite', result, path),
  LoadSyncFile: (path) => ipcRenderer.invoke('loadSyncFile', path),
  CheckFileExists: (path) => ipcRenderer.invoke('checkFileExists', path),
  GetRecentFiles: () => ipcRenderer.invoke('getRecentFiles'),
  OpenSyncFileDialog: () => ipcRenderer.invoke('openSyncFileDialog'),
  SaveSyncFileDialog: (defaultName) => ipcRenderer.invoke('saveSyncFileDialog', defaultName),
  SaveExportFileDialog: (defaultName) => ipcRenderer.invoke('saveExportFileDialog', defaultName),
  ChooseMediaFileDialog: (currentPath) => ipcRenderer.invoke('chooseMediaFileDialog', currentPath),
  ChooseViewerPackageFolderDialog: () => ipcRenderer.invoke('chooseViewerPackageFolderDialog'),
  ExportViewerPackage: (saveFolder, mediaSource, dep, xml, srt) => ipcRenderer.invoke('exportViewerPackage', saveFolder, mediaSource, dep, xml, srt),
  QuitApplication: () => ipcRenderer.invoke('quitApplication'),
  OpenExternalURL: (url) => ipcRenderer.invoke('openExternalURL', url),
};

// window.api
contextBridge.exposeInMainWorld("api", WINDOW_API);