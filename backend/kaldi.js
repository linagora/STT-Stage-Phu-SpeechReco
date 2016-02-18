"use strict";

exports.transcribeKaldi = function(req, res) {
	var fs = require('fs-extra');
  	var socket = require('./websocket.js').getSocket();
  	var selectedInput = req.params.inputtype;

  	//get data necessary which are original text and audio file (record audio or internet audio)
	  
	if (selectedInput === 'audio'){
	  	var textFile = getData("text");
	    var audioFile = getData("audio");
	}
	else if (selectedInput === 'micro')
		var audioFile = getData("micro");

	//send message 202 to client to notice the client that its request is accepted
    res.send(202);

	if (audioFile === 'error'){ //verify if audio data is ready 
		socket.emit('send msg',{
			transcribedText: "Audio input is missing. Upload or record your file first...",
			compareObject: "",
			originalTextExport: "",
		});
	} 
	else {
	    //treat the client request
		switch (selectedInput){ 
			case 'audio':
				var kaldiRoot = __dirname+'/lib/kaldi-trunk';
				console.log('transcribe by kaldi starting');
				//kaldi function need the kaldi directory, audio file path and a function call as inputs
				transcribeByKaldi(kaldiRoot,audioFile, callbackAudio);
				//the callback function that will transfer the socket that composes the transcribe text, original text and the campare object
				function callbackAudio(result){
					if (textFile !== 'error'){ //text file is uploaded
						var originalText = fs.readFileSync(textFile,"UTF-8").toLowerCase(); 
						fs.unlinkSync(textFile);
						fs.unlinkSync(audioFile);
						console.log("kaldi renvoie resultat");
						console.log(result);
						socket.emit('send msg', {
							transcribedText: result,
							compareObject: campareText(result, originalText),
							originalTextExport: originalText,
						});
						console.log("kaldi fini");
					}
					else //text file is NOT uploaded
						socket.emit('send msg', {
						transcribedText: result,
						compareObject: "",
						originalTextExport: "",
						});
				};
				break;
			case 'micro':
				var kaldiRoot = __dirname+'/lib/kaldi-trunk';
				transcribeByKaldi(kaldiRoot,audioFile, callbackMicro);
				function callbackMicro(result){
					fs.unlinkSync(audioFile);
					console.log("kaldi renvoie resultat");
					socket.emit('send msg',{
						transcribedText: result,
						compareObject: "No needed for an input by micro",
						originalTextExport: "No needed for an input by micro",
					});
					console.log("kaldi fini");
				};
				break;
			default:
				break;
	    }
	}
}

//Transcribe by kaldi function that give the transcribed text in outpout
function transcribeByKaldi(kaldiPath, filePath, callback){
	//use chid process of node js to call an unix command that give the transcribed text in stdout. 
	//This stdout is the output of the function
	var exec = require('child_process').exec;
	var cmd1 = 'cd '+kaldiPath+'/egs/online-nnet2/';
	var cmd2 = './run.sh '+kaldiPath+' '+filePath;
	console.log(cmd1+' ; '+cmd2);
	exec(cmd1+' ; '+cmd2, function(error, stdout, stderr) {
		if (stdout !== ""){
			callback(stdout);
		} else {
			socket.emit('send error', {
			  transcribedText:" Error of transcript. Maybe the audio is not suitable. Please convert it.."
			});
		}
		if (error !== null) {
			console.log('exec error: ' + error);
		}
	}); 
};

//get the path of data necessary when it's an audio, recorded audio or text
  function getData(typeData){
    var fs = require('fs-extra');
    var filePath = 'error';
    switch (typeData){
      case "audio":
        if (fs.readdirSync(__dirname+'/../upload_audio/').length !== 0)
          filePath = __dirname+'/../upload_audio/'+(fs.readdirSync(__dirname+'/../upload_audio/'))[0];
        break;
      case "micro":
        if (fs.readdirSync(__dirname+'/../recorded_audio/').length !== 0)
          filePath = __dirname+'/../recorded_audio/'+(fs.readdirSync(__dirname+'/../recorded_audio/'))[0];
        break;
      case "text":
        if (fs.readdirSync(__dirname+'/../upload_text/').length !== 0)
          filePath = __dirname+'/../upload_text/'+(fs.readdirSync(__dirname+'/../upload_text/'))[0];
        break;
      default:
        break;
    };
    return filePath;
  };

  //campare 2 strings and give to output the diff object that show the different btw 2 strings
  function campareText(cibleText, originalText){
    var jsdiff = require('diff');
    var diffObject = jsdiff.diffWords(originalText, cibleText);
    return diffObject;
  };