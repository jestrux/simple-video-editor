const {menubar} = require('menubar');
const {ipcMain, Notification, app} = require("electron");
const ffmpeg = require('fluent-ffmpeg');
const path = require('path'), fs =require('fs');
let mainApp = {}; // for things that shouldn't be garbage collected

const mb = menubar({
    icon: 'icon.png',
    browserWindow: {
        // width: 1000, height: 460,
        width: 650, height: 460,
        transparent: true
    },
    preloadWindow: true,
    webPreferences: {
        nodeIntegration: true
    }
});

// mb.on('after-create-window', () => mb.window.openDevTools())

mb.on('ready', () => {
    console.log('app is ready');
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
    
    mb.window.webContents.send('cut-progress', 0);
    ffmpeg(filePath)
        .setStartTime(startTime)
        .setDuration(duration)
        .withVideoBitrate('900k')
        .withSize('750x?')
        .output(outputPath)
        .on('end', function (error) {
            if (error){
                console.log("Error clipping!", error);
                mb.window.webContents.send('cut-error', 'Failed', error);

                mainApp.notification = new Notification({
                    title: 'Failed to cut video',
                    body: error.toString()
                });
                mainApp.notification.show();

                return;
            }
            
            mb.window.webContents.send('cut-done', outputPath);
            console.log('cut done', outputPath);

            mainApp.notification = new Notification({
                title: 'Video was successfully cut',
                body: 'You can find new cut video in your Downloads'
            });
            mainApp.notification.on("click", _ev => {
                mb.window.previewFile(outputPath);
            });
            mainApp.notification.show();
        })
        .on('progress', function (progress) {
            mb.window.webContents.send('cut-progress', progress.percent);
            console.log('Progress......' + progress.percent + '%');
        })
        .on('error', function (error) {
            console.log('error: ', error);
            mainApp.notification = new Notification({
                title: 'Failed to cut video',
                body: error.toString()
            });
            mainApp.notification.show();
            mb.window.webContents.send('cut-error', 'Failed', error);
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