const {BrowserWindow, ipcMain, Notification, app} = require("electron");
const ffmpeg = require('fluent-ffmpeg');
const fs =require('fs');
let mainApp = {}; // for things that shouldn't be garbage collected
let mainWindow = {};

// mb.on('after-create-window', () => mainWindow.openDevTools())

function createWindow () {
    mainWindow = new BrowserWindow({
      width: 700,
      height: 480,
      webPreferences: {
        nodeIntegration: true
      }
    });
  
    mainWindow.loadFile('index.html')
  
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// mb.on('ready', () => {
//     console.log('app is ready');
// });
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin')
        app.quit();
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0)
        createWindow();
});

ipcMain.on('log', (_event, content) => {
    console.log(content);
});

ipcMain.on('cut-video', (_event, ...params) => {
    cutVideo(...params);
});

async function cutVideo(filePath, startTime, duration, outputPath) {
    if(!outputPath){
        const ext = '.' + filePath.split('.').pop();
        let fileName = filePath.split('.');
        fileName.pop();
        fileName = fileName.join('.').split('/').pop() + " - chopped";
        const matchingFiles = await matchingFilesInDir(app.getPath("downloads"), fileName);
        fileName += (matchingFiles > 0) ? ' - ' + matchingFiles : '';
        outputPath = app.getPath("downloads") + '/' + fileName + ext;
    }
    
    mainWindow.webContents.send('cut-progress', 0);
    ffmpeg(filePath)
        .setStartTime(startTime)
        .setDuration(duration)
        .withVideoBitrate('900k')
        .withSize('750x?')
        .output(outputPath)
        .on('end', function (error) {
            if (error){
                console.log("Error clipping!", error);
                mainWindow.webContents.send('cut-error', 'Failed', error);

                mainApp.notification = new Notification({
                    title: 'Failed to cut video',
                    body: error.toString()
                });
                mainApp.notification.show();

                return;
            }
            
            mainWindow.webContents.send('cut-done', outputPath);
            console.log('cut done', outputPath);

            mainApp.notification = new Notification({
                title: 'Video was successfully cut',
                body: 'You can find new cut video in your Downloads'
            });
            mainApp.notification.on("click", _ev => {
                mainWindow.previewFile(outputPath);
            });
            mainApp.notification.show();
        })
        .on('progress', function (progress) {
            mainWindow.webContents.send('cut-progress', progress.percent);
            console.log('Progress......' + progress.percent + '%');
        })
        .on('error', function (error) {
            console.log('error: ', error);
            mainApp.notification = new Notification({
                title: 'Failed to cut video',
                body: error.toString()
            });
            mainApp.notification.show();
            mainWindow.webContents.send('cut-error', 'Failed', error);
        })
        .run();
}

function matchingFilesInDir(folder,filter){
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(folder)){
            reject(`Folder: ${folder} not found!`);
            return;
        }
    
        const files=fs.readdirSync(folder);
        const matchingFiles = files.filter(filename => filename.indexOf(filter) !== -1);
        resolve(matchingFiles.length);
    })
};