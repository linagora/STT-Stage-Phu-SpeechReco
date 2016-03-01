'use strict';

exports.convertAudio = function(req, res) {
    var fs = require('fs-extra');
    var toolName = req.params.toolname;
    var inputType =req.params.inputtype;
    var clientName = req.params.clientname;
    var audioFolder;
    var audioName = clientName+'.wav';
    console.log(audioName);
    switch (inputType){
        case 'audiofile':
            audioFolder = __dirname+'/../upload_audio';
            break;
        case 'yourmicro':
            audioFolder = __dirname+'/../recorded_audio';
            break;
        default:
            break;
    }
    if (fs.existsSync(audioFolder+'/'+audioName)){
        switch (toolName){
            case "Sphinx-4":
                var exec = require('child_process').exec;
                var cmd1 = 'cd '+audioFolder;
                var cmd2 = 'sox '+audioName+' -c 1 -r 16000 -b 16 '+audioName+'-convertedforsphinx.wav';
                exec(cmd1+' ; '+cmd2, function(error, stdout, stderr) {
                    console.log('convert ok');
                    fs.unlinkSync(audioFolder + '/' + audioName);
                    res.json({
                        convertMsg: 'Convert ok!!',
                    });
                });
            break;
            case "Kaldi":
                var exec = require('child_process').exec;
                var cmd1 = 'cd '+audioFolder;
                var cmd2 = 'sox '+audioName+' -c 1 -r 8000 -b 16 '+audioName+'-convertedforkaldi.wav';
                exec(cmd1+' ; '+cmd2, function(error, stdout, stderr) {
                    console.log('convert ok');
                    fs.unlinkSync(audioFolder + '/' + audioName);
                    res.json({
                        convertMsg:'Convert ok!!'
                    });
                });
                break;
            default:
                break;
        };
    }
    else 
        res.json({
            convertMsg:'Your audio is missing'
        });
};