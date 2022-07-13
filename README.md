# Deposync Client Application
This client application is used to interact with the syncdepo API to synchronize and QC video depositions

## building/packaging notes:
- using electron-builder to build app
- took forever to get ffmpeg to actually work when built. followed these steps: 
https://alexandercleasby.dev/blog/use-ffmpeg-electron
https://stackoverflow.com/questions/47848621/how-can-i-bundle-ffmpeg-in-an-electron-application

- we are using ffmpeg-static-electron which is a fork of ffmpeg-static
https://github.com/pietrop/ffmpeg-static-electron

