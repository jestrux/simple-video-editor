var ffmpeg = require('fluent-ffmpeg');
console.log("Converting....");
ffmpeg(__dirname + '/spider-man.mp4')
    .setStartTime('00:19:12')
    .setDuration('20')
    .withVideoBitrate('900k')
    .withSize('750x?')
    .output(__dirname + '/bo.mp4')
    .on('end', function(err) {
        if(err)
            console.log("Error clipping!", err);
        if(!err)
            console.log('conversion Done');          
    })
    .on('progress', function(progress){
        console.log('Progress......' + progress.percent + '%');
    })
    .on('error', function(err){
        console.log('error: ', err);
    })
    .run();