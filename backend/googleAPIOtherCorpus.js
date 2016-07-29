"use strict";

exports.transcribeCorpus = function(req, res){
	console.log('Google Api recoie requete: '+req.params.corpusName);
	var corpus = req.params.corpusName;
	var speech = require('google-speech-api');
	var fs = require('fs-extra');
	var socket = require('./websocket.js').getSocket();
	var calculs = require('./calculs.js');
	var lemmer =  require('lemmer');
	var corpusFolder = __dirname+'/../corpus/'+corpus+'/';
	var audioFilesFolder = corpusFolder+'wav/';
	var textFilesFolder = corpusFolder+'txt/';
	var keywordsFolder = corpusFolder+'keywords/';
	var audioName;
	var lines = fs.readFileSync(corpusFolder+corpus+'.txt').toString().split('\n');
	var audio_utt = __dirname+'/lib/googleApi/audio_utt.txt';
	var output = [];
	var input = [];
	var time = 0;

	res.send(202);
	createInput(0);

	function createInput(i){
	    var files = lines[i].toString().split(' ');
    	audioName = files[0];
    	input.push(audioFilesFolder+audioName);
    	if (i!==(lines.length-1)){
			createInput(i+1);
    	}else{
			transcribe(input,0);	
    	}
	};

	function transcribe(filePaths,i){
		console.log(filePaths[i]);
		if (i!==filePaths.length) {
			var opts = {
				file: filePaths[i],
				key: 'AIzaSyCA9K61DkVf8iO3br_LgrSEtoq1ZL8q3uA',
				timeout: '100000',
				sampleRate: '16000',
				lang: 'en-US',
				maxRequests: 1
			};
			var speech = require('google-speech-api');
			var start = new Date().getTime();
			speech(opts, function (err, results) {
				if(err){
					console.log(err);
					return;
				}
				//console.log(results)
				var result='';
				var resultsL = results.length;
			  	for (var j=0;j<resultsL;j++){
			  		if (results[j].trans.result[0] != undefined)
			  			result+=(results[j].trans.result[0]).alternative[0].transcript+' ';
			    	if (j===resultsL-1) {
			    		var end = new Date().getTime();
			    		time += (end-start)/(1000*60);
			    		output.push(result);
			    		transcribe(filePaths,i+1);
			    	} 
			  	}
			});
    	}
		else {
			sendResults(output,time,0);
		}
	}

	function sendResults(results,time,i){
		console.log('Audio '+i)
		var result = results[i];
		console.log("*transcribed*: "+result);
		var txtName = (lines[i].toString().split(' '))[1];
		var originalText = fs.readFileSync(textFilesFolder+txtName,"UTF-8").toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"");
		//console.log('org: '+originalText);
		var resultTable = result.split(' ');
		var textTable = originalText.split(' ');
		var keywords = getKeywords(keywordsFolder+txtName);
		//send socket to client time by time
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
				var keywordsSimplifize = [];
				keywords.forEach(function(keyword){
					if (keyword!==''&&keyword!==' '){
						keywordsSimplifize.push(keyword.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(' ',''))
					}
				})
				//lemmatize keywords
				lemmer.lemmatize(keywordsSimplifize, function(err, transformKeywords){
					var keywordsSimplifize = [];
					keywords.forEach(function(keyword){
						if (keyword!==''&&keyword!==' '){
							keywordsSimplifize.push(keyword.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(' ',''))
						}
					})
					//var campare = campareText(result, originalText);
					var precisionRecall = calculs.precisionRecall(resultSimplifize.split(' '), transformKeywords);
					//var precisionRecall = calculs.precisionRecall(resultTable,keywordsSimplifize);
					if (i !== (lines.length-1)){
						socket.emit('send msg', {
							WER: calculs.werCalcul(campare,textSimplifize),
							//WER: calculs.werCalcul(campare, originalText),
							recall: precisionRecall.recall,
							timeExec: 0
						});
						var audio = results[i].substr(0,results[i].indexOf(' ',0));
						console.log(audio+' msg is send');
						sendResults(results,time,i+1);		
					} else {
						socket.emit('send last msg', {
							WER: calculs.werCalcul(campare,textSimplifize),
							//WER: calculs.werCalcul(campare, originalText),
							recall: precisionRecall.recall,
							timeExec: time
						});
						var audio = results[i].substr(0,results[i].indexOf(' ',0));
						console.log(audio+' msg is send');
					}
				});
			});
		});	
    }
}


//campare 2 strings and give to output the diff object that show the different btw 2 strings
function campareText(cibleText, originalText){
	var jsdiff = require('diff');
	var diffObject = jsdiff.diffWords(originalText, cibleText);
	return diffObject;
};

//get keywords
function getKeywords (filePath){
	var fs = require('fs-extra');
	return fs.readFileSync(filePath).toString().split('\n');
}