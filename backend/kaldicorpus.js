"use strict";

//for corpus
exports.transcribeCorpusKaldi = function(req, res) {
	console.log('Kaldi recoie requete: '+req.params.corpusName);
	var fs = require('fs-extra');
	var socket = require('./websocket.js').getSocket();
	var calculs = require('./calculs.js');
	var lemmer =  require('lemmer');
	var corpus = req.params.corpusName;
	var corpusFolder = __dirname+'/../corpus/'+corpus+'/';
	var audioFilesFolder = __dirname+'/../corpus/'+corpus+'/wav-for-kaldi/';
	var textFilesFolder = __dirname+'/../corpus/'+corpus+'/txt/';
	var kaldiRoot = __dirname+'/lib/kaldi-trunk';
	var txtName;
	var audioName;
	var lines = fs.readFileSync(corpusFolder+corpus+'.txt').toString().split('\n');
	res.send(202);

	analize(0);

	function analize(i){
	    var files = lines[i].toString().split(' ');
    	txtName = files[1];
    	audioName = files[0];
    	console.log('Kaldi transcribes file '+audioName+'>>>>>');
    	transcribeByKaldi(kaldiRoot,audioFilesFolder+audioName,i,txtName,audioName,callback);
	};	

	function callback(i, result,audioName,txtName){
		var originalText = fs.readFileSync(textFilesFolder+txtName,"UTF-8").toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"");
		console.log('org: '+originalText);
		var resultTable = result.split(' ');
		var textTable = originalText.split(' ');
		//send socket to client time by time
    	console.log('Kaldi send transcript of file '+audioName+'>>>>>');
    	//simplifize
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
				var campare = campareText(resultSimplifize, textSimplifize);
				var precisionRecall = calculs.precisionRecall(campare);
				if (i !== (lines.length-1)){
					socket.emit('send msg', {
						compareObject: campare,
						WER: calculs.werCalcul(campare,textSimplifize),	
						precision: precisionRecall.Precision,
						recall: precisionRecall.Recall,
						fScore: precisionRecall.FScore	
					});
					console.log('Kaldi is done with '+audioName+'>>>>>');
					analize(i+1);		
				} else {
					socket.emit('send last msg', {
						compareObject: campare,
						WER: calculs.werCalcul(campare,textSimplifize),
						precision: precisionRecall.Precision,
						recall: precisionRecall.Recall,
						fScore: precisionRecall.FScore	
					});
					console.log('Kaldi is done with '+audioName+'>>>>>');
				}
			});
		});	
    }
};

//Transcribe by kaldi function that give the transcribed text in outpout
function transcribeByKaldi(kaldiPath,filePath,i,txtName,audioName,callback){
	//use chid process of node js to call an unix command that give the transcribed text in stdout. 
	//This stdout is the output of the function
	var exec = require('child_process').exec;
	var cmd1 = 'cd '+kaldiPath+'/egs/online-nnet2/';
	var cmd2 = './run.sh '+kaldiPath+' '+filePath;
	exec(cmd1+' ; '+cmd2, function(error, stdout, stderr) {
		//console.log('fini '+audioName+' '+stdout);
		if (stdout !== ""){
			console.log('trans: '+stdout);
			callback(i,stdout,audioName,txtName);
		} else console.log('error');
	}); 
};

//get the path of data necessary when it's an audio, recorded audio or text
function getData(typeData, clientName){
	var fs = require('fs-extra');
	var filePath = 'error';
	switch (typeData){
		case "audio":
			if (fs.existsSync(__dirname+'/../upload_audio/'+clientName+'.wav-convertedforkaldi.wav'))
				filePath = __dirname+'/../upload_audio/'+clientName+'.wav-convertedforkaldi.wav';
			break;
		case "micro":
			if (fs.existsSync(__dirname+'/../recorded_audio/'+clientName+'.wav-convertedforkaldi.wav'))
				filePath = __dirname+'/../recorded_audio/'+clientName+'.wav-convertedforkaldi.wav';
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