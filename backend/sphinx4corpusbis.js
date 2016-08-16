"use strict";

//for corpus
exports.transcribeCorpus = function(req, res) {
	console.log('Sphinx recoie requete: '+req.params.corpusName);
	var fs = require('fs-extra');
	var socket = require('./websocket.js').getSocket();
	var calculs = require('./calculs.js');
	var lemmer =  require('lemmer');
	var corpus = req.params.corpusName;
	var corpusFolder = __dirname+'/../corpus/'+corpus+'/';
	var audioFilesFolder = __dirname+'/../corpus/'+corpus+'/wav-for-sphinx/';
	var textFilesFolder = __dirname+'/../corpus/'+corpus+'/txt/';
	var keywordsFolder = __dirname+'/../corpus/'+corpus+'/keywords/';
	var audioName;
	var stopWords;
	fs.readFile(__dirname+'/lib/stopwords.txt','utf-8',function(err,data){
		stopWords = data.split('\n');
	})
	var lines = fs.readFileSync(corpusFolder+corpus+'.txt').toString().split('\n');
	var audio_utt = __dirname+'/lib/sphinx-4/audio_utt.txt';
	var output = __dirname+'/lib/sphinx-4/output.txt';
	res.send(202);
	//clear input & output
	clearTxt(audio_utt);
	clearTxt(output);
	//begin transcribing
	createInput(0);

	//create liste audio input of kaldi
	function createInput(i){
	    var files = lines[i].toString().split(' ');
    	audioName = files[0];
    	if (i===(lines.length-1)){
			fs.appendFile(audio_utt,audioName+' '+audioFilesFolder+audioName, function (){
				transcribeBySphinx(audio_utt, output, sendResults);
			});
    	}else{
			fs.appendFile(audio_utt,audioName+' '+audioFilesFolder+audioName+'\n', function (){
				createInput(i+1);
			});
    	}
	};	

	function transcribeBySphinx(input, output, callback){
		//use chid process of node js to call an unix command that give the transcribed text in stdout. 
		//This stdout is the output of the function
		var exec = require('child_process').exec;
		var cmd1 = 'cd '+__dirname+'/lib/sphinx-4/';
		var cmd2 = 'java -jar speechtotext.jar '+input+' '+output;
		console.log(cmd2);
		var start = new Date().getTime();
		exec(cmd1+' ; '+cmd2, function(stderr){
			console.log('transcibe done');
			var end = new Date().getTime();
			var timeExec = (end - start)/(1000*60);
			var results = fs.readFileSync(output).toString().split('\n');
			callback(results,timeExec,0);
		}); 
	};

	function sendResults(results,time,i){
		console.log('Audio '+i);
		var result = results[i].substr(results[i].indexOf(' ',0)+1);
		console.log("result: "+result);
		var txtName = (lines[i].toString().split(' '))[1];
		var originalText = fs.readFileSync(textFilesFolder+txtName,"UTF-8").toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,'');
		console.log('org: '+originalText);
		var tm = require('text-miner');
		var my_corpus = new tm.Corpus([result,originalText]).removeWords(stopWords);
		console.log('result after: '+my_corpus.documents[0]);
		console.log('org after: '+my_corpus.documents[1]);
		var resultTable = my_corpus.documents[0].replace("<unk>",'').replace(" ' ",' ').split(' ');
		var textTable = my_corpus.documents[1].replace(" ' ",' ').split(' ');
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
};

//clear txt file
function clearTxt(filePath){
	var fs = require('fs');
	fs.truncate(filePath, 0, function(){});
}

//get keywords
function getKeywords (filePath){
	var fs = require('fs-extra');
	return fs.readFileSync(filePath).toString().split('\n');
}

//campare 2 strings and give to output the diff object that show the different btw 2 strings
function campareText(cibleText, originalText){
	var jsdiff = require('diff');
	var diffObject = jsdiff.diffWords(originalText, cibleText);
	return diffObject;
};