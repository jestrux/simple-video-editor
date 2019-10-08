const {menubar} = require('menubar');
const {ipcMain, Notification} = require("electron");
const ffmpeg = require('fluent-ffmpeg');
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

function cutVideo(filePath = __dirname + "/friends.webm", startTime = "00:00:15", duration = "10", outputPath = __dirname + '/friends-cut.mp4') {
    mb.window.webContents.send('cut-progress', 0);
    ffmpeg(filePath)
        .setStartTime(startTime)
        .setDuration(duration)
        .withVideoBitrate('900k')
        .withSize('750x?')
        .output(outputPath)
        .on('end', function (err) {
            if (err){
                console.log("Error clipping!", err);
                mb.window.webContents.send('cut-error', 'Failed', error);
                return;
            }
            
            mb.window.webContents.send('cut-done', filePath);
            console.log('cut done', filePath);

            mainApp.notification = new Notification({
                title: 'Video was successfully cut',
                body: 'You can find new cut video in your Downloads'
            });
            mainApp.notification.on("click", _ev => {
                console.log("User Clicked on Notification");
                mb.window.previewFile(outputPath);
            });
            mainApp.notification.show();
        })
        .on('progress', function (progress) {
            mb.window.webContents.send('cut-progress', progress.percent);
            console.log('Progress......' + progress.percent + '%');
        })
        .on('error', function (err) {
            console.log('error: ', err);
            mb.window.webContents.send('cut-error', 'Failed', error);
        })
        .run();
}