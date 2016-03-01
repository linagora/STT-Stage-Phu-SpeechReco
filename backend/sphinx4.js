"use strict";

exports.transcribeSphinx = function(req, res) {
	var fs = require('fs-extra');
	var lemmer =  require('lemmer');
	var socket = require('./websocket.js').getSocket();
	var selectedInput = req.params.inputtype;
	var clientName = req.params.clientname;

	//get data necessary which are original text and audio file (record audio or internet audio)
	if (selectedInput === 'audio'){
	  	var textFile = getData("text", clientName);
	    var audioFile = getData("audio", clientName);
	}
	else if (selectedInput === 'micro')
		var audioFile = getData("micro", clientName);
	
	console.log(audioFile);
	if (audioFile === 'error'){ //verify if audio data is ready 
		console.log('errorr');
		res.json('send msg',{
			transcribedText: "Audio input is missing or you did not convert it yet...",
			compareObject: "",
			originalTextExport: "",
		});
	}
	else {
		//execute the transcribe function to get transcribed text in result variable
	    console.log('Transcribe by Sphinx-4 starting');
	    var java = require('java');
	    var result = transcribeBySphinx(audioFile).replace(/\n/g," ");
	    res.send(202);
	    setTimeout(function(){
    		//put fs.unlinkSync(audioFile) in nexTick to ensure that audio file will only be deleted when the transcript is done
    		process.nextTick(function(){
		    	fs.unlinkSync(audioFile); 
		    });
		    switch (selectedInput){//2 cases of input (audio or micro)
		      	case 'audio':
			        if (textFile !== 'error'){ //text file is uploaded
						//get the original text
						var originalText = fs.readFileSync(textFile,"UTF-8").toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,""); 
						fs.unlinkSync(textFile);
						console.log('result: '+result);
						console.log('org: '+originalText);
						var resultTable = result.split(' ');
						var textTable = originalText.split(' ');

						lemmer.lemmatize(resultTable, function(err, transformResult){
							var resultSimplifize='';
							transformResult.forEach(function(word){
								resultSimplifize+=word+' ';
							});
							lemmer.lemmatize(textTable, function(err, transformText){
								var textSimplifize='';
								transformText.forEach(function(word){
									textSimplifize+=word+' ';
								});
								socket.emit('send msg audio',{
									transcribedText: resultSimplifize,
									compareObject: campareText(resultSimplifize, textSimplifize),
									originalTextExport: textSimplifize
								});
							});
						});	
			        } 
			        else {//text file is NOT uploaded
			        	var resultTable = result.split(' ');
						lemmer.lemmatize(resultTable, function(err, transformResult){
							var resultSimplifize='';
							transformResult.forEach(function(word){
								resultSimplifize+=word+' ';
							});
							socket.emit('send msg audio',{
								transcribedText: resultSimplifize,
								compareObject: "",
								originalTextExport: ""
							});
						});
					}
		        break;
		      	case 'micro':
		        	socket.emit('send msg micro',{
		          		transcribedText: result
		        	});
		        	break;
		      	default:
		        	break;
		    };  
    	},2000);
    }	    
};

//transcribe by sphinx function that give the transcribed text in outpout
function transcribeBySphinx(filePath,num){
	var java = require('java');
	if (num === undefined){
		java.classpath.push(__dirname+'/lib/speechtotext.jar');	
		var S2T = java.import('AppTestSpeechReco');
		var appSpeech = new S2T();
		var resultFinal = appSpeech.transcribeSync(filePath);
	}
	else{
		java.classpath.push(__dirname+"/../target/sphinx-4-lib-1.0-SNAPSHOT-jar-with-dependencies.jar");
		//add sphinx-4 librairie
		//Configuration
		var Configuration = java.import("edu.cmu.sphinx.api.Configuration");
		var FileInputStream = java.import("java.io.FileInputStream");
		var SpeechResult = java.import("edu.cmu.sphinx.api.SpeechResult");
		var Recognizer = java.import("edu.cmu.sphinx.api.StreamSpeechRecognizer");
		var configuration = new Configuration();
		configuration.setAcousticModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us");
		configuration.setDictionaryPathSync("resource:/edu/cmu/sphinx/models/en-us/cmudict-en-us.dict");
		configuration.setLanguageModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us.lm.bin");
		var recognizer = new Recognizer(configuration);
		var fileInputStream = new FileInputStream(filePath);
		recognizer.startRecognitionSync(fileInputStream);
		var resultFinal = "";
		var result;
		while ((result = recognizer.getResultSync()) !== null) {
			resultFinal = resultFinal + result.getHypothesisSync() + ' ';
			console.log('result: '+result.getHypothesisSync());
		}
		recognizer.stopRecognitionSync();
		console.log('result: '+resultFinal);
	}
	return resultFinal;
};  

//get the path of data necessary when it's an audio, recorded audio or text
function getData(typeData, clientName){
	var fs = require('fs-extra');
	var filePath = 'error';
	switch (typeData){
		case "audio":
			if (fs.existsSync(__dirname+'/../upload_audio/'+clientName+'.wav-convertedforsphinx.wav'))
				filePath = __dirname+'/../upload_audio/'+clientName+'.wav-convertedforsphinx.wav';
			break;
		case "micro":
			if (fs.existsSync(__dirname+'/../recorded_audio/'+clientName+'.wav-convertedforsphinx.wav'))
				filePath = __dirname+'/../recorded_audio/'+clientName+'.wav-convertedforsphinx.wav';
			break;
		case "text":
			if (fs.existsSync(__dirname+'/../upload_text/'+clientName+'.txt'))
				filePath = __dirname+'/../upload_text/'+clientName+'.txt';
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