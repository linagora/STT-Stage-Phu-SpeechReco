'use strict';

exports.uploadFile = function(req, res, next){
  var datatype = req.params.datatype;
  var fileName = req.params.filename;
  console.log(fileName);
  if (datatype === 'stream'){
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file) {
      //Path where audio file will be uploaded
      if (fileName.indexOf('.wav') !== -1){  
        var fs = require('fs-extra');       //File System - for file manipulation      
        var fstream;
        var dirUploadFolder = __dirname+'/../upload_audio/';
        if (!fs.existsSync(dirUploadFolder)){
          fs.mkdirSync(dirUploadFolder);
        }
        fstream = fs.createWriteStream(dirUploadFolder+fileName);
        file.pipe(fstream);
        fstream.on('close', function () {    
          //console.log("Upload Finished of " + filename);       
          res.end();
        });
      }
      if (fileName.indexOf('.txt') !== -1){
        var fs = require('fs-extra');       //File System - for file manipulation
        var fstream;
        var dirUploadFolder = __dirname+'/../upload_text/';
        if (!fs.existsSync(dirUploadFolder)){
          fs.mkdirSync(dirUploadFolder);
        }
        fstream = fs.createWriteStream(dirUploadFolder+fileName);
        file.pipe(fstream);
        fstream.on('close', function () {          
          res.end();
        });
      }
    });
  }
  else if (datatype === 'file'){
    var fs = require('fs-extra');
    var file = req.body;
    var fd = __dirname+'/../recorded_audio/'+fileName+'.wav';

    if (!fs.existsSync(__dirname+'/../recorded_audio/')){
      fs.mkdirSync(__dirname+'/../recorded_audio/');
    } 

    file.contents = file.contents.split(',').pop();

    var buf = new Buffer(file.contents, 'base64');
    fs.writeFileSync(fd,buf);
    res.end();  
  }
};

