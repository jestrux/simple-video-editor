const {menubar} = require('menubar');
const {ipcMain} = require("electron");
const ffmpeg = require('fluent-ffmpeg');

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

ipcMain.on('log', (event, content) => {
    console.log(content);
});

ipcMain.on('save-video', (event, link) => {
    //   clipboard.writeText(link, 'selection')
});

ipcMain.on('state-change', (event, state) => {
    switch (state) {
        case "video-loaded":
        default:
            mb.window.setSize(630, 460);
            break;
    }
});

function cutVideo(filePath = __dirname + "/friends.webm", startTime = "00:00:15", duration = "10", outputPath = __dirname + '/friends-cut.mp4') {
    console.log("Cutting....");
    ffmpeg(filePath)
        .setStartTime(startTime)
        .setDuration(duration)
        .withVideoBitrate('900k')
        .withSize('750x?')
        .output(outputPath)
        .on('end', function (err) {
            if (err)
                console.log("Error clipping!", err);
            if (!err)
                console.log('conversion Done');
        })
        .on('progress', function (progress) {
            console.log('Progress......' + progress.percent + '%');
        })
        .on('error', function (err) {
            console.log('error: ', err);
        })
        .run();
}