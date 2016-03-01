"use strict";

//for corpus
exports.transcribeCorpusSphinx = function(req, res) {
	console.log('Sphinx recoie requete: '+req.params.corpusName);
	var fs = require('fs-extra');
	var corpus = req.params.corpusName;
	var corpusFolder = __dirname+'/../corpus/'+corpus+'/';
	var audioFilesFolder = __dirname+'/../corpus/'+corpus+'/wav-for-sphinx/';
	var textFilesFolder = __dirname+'/../corpus/'+corpus+'/txt/';
	var txtName;
	var audioName;
	var lines = fs.readFileSync(corpusFolder+corpus+'.txt').toString().split('\n');
	var listResult = [];
	var wersSum = 0;
	var precisionSum = 0;
	var recallSum = 0;
	var fScoreSum = 0;
	var numAudio = 0;

	var java = require('java');

	/*java.classpath.push(__dirname+"/../target/sphinx-4-lib-1.0-SNAPSHOT-jar-with-dependencies.jar");
	var Configuration = java.import("edu.cmu.sphinx.api.Configuration");
	var configuration = new Configuration();
	configuration.setAcousticModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us");
	configuration.setDictionaryPathSync("resource:/edu/cmu/sphinx/models/en-us/cmudict-en-us.dict");
	configuration.setLanguageModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us.lm.bin");*/
	function analize(i){
	    var files = lines[i].toString().split(' ');
    	txtName = files[1];
    	audioName = files[0];
    	console.log('Sphinx-4 transcribes file '+audioName+'>>>>>');
		transcribeBySphinx(audioName,txtName,i);
	};	

    //transcribe by sphinx function that give the transcribed text in outpout
	function transcribeBySphinx(audioName,txtName,i,num){
		if (num === undefined){
			java.classpath.push(__dirname+'/lib/speechtotext.jar');
			var S2T = java.import('AppTestSpeechReco');
			var appSpeech = new S2T();
			var result = appSpeech.transcribeSync(audioFilesFolder+audioName).replace(/\n/g," ");
		}
		else{
			//Configuration			var FileInputStream = java.import("java.io.FileInputStream");
			var SpeechResult = java.import("edu.cmu.sphinx.api.SpeechResult");
			var Recognizer = java.import("edu.cmu.sphinx.api.StreamSpeechRecognizer");
			
			var recognizer = new Recognizer(configuration);
			var fileInputStream = new FileInputStream(audioFilesFolder+audioName);
			recognizer.startRecognitionSync(fileInputStream);
			var resultE;
			while ((resultE = recognizer.getResultSync()) !== null) {
				result= result + resultE.getHypothesisSync() + ' ';
				console.log('result: '+resultE.getHypothesisSync());
			}
			recognizer.stopRecognitionSync();
		}
		console.log('trans:'+result);
		process.nextTick(function(){
			var originalText = fs.readFileSync(textFilesFolder+txtName,"UTF-8").toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"");
			console.log('org: '+originalText);
			var resultTable = result.split(' ');
			var textTable = originalText.split(' ');
	    	console.log('Sphinx-4 sends transcript of file '+audioName+'>>>>>');
	    	listResult.push({
	    		Text: textTable,
	    		Result: resultTable
	    	})
	    	console.log('Sphinx-4 is done with '+audioName+'>>>>>');
	    	if(i!==(lines.length-1)) analize(i+1);
	    	else {
	    		res.send(202);
	    		setTimeout(simplifize(listResult,0),1000);	
	    	}
		});
	};

	analize(0);  
};
function simplifize(listResult,i){
	var socket = require('./websocket.js').getSocket();
	var lemmer =  require('lemmer');
	var calculs = require('./calculs.js');
	var item = listResult[i];
	var resultTable = item.Result;
	var textTable = item.Text;
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
			var wer = calculs.werCalcul(campareText(resultSimplifize, textSimplifize),textSimplifize);
			var campare = campareText(resultSimplifize, textSimplifize);
			var precisionRecall = calculs.precisionRecall(campare);
			setTimeout(function(){
				if (i !== (listResult.length-1)){
					socket.emit('send msg',{
						compareObject: campare,
						WER: wer,
						precision: precisionRecall.Precision,
						recall: precisionRecall.Recall,
						fScore: precisionRecall.FScore
					});
					console.log('send result');
					simplifize(listResult,i+1);
				}
				else {
					socket.emit('send last msg',{
						compareObject: campare,
						WER: wer,
						precision: precisionRecall.Precision,
						recall: precisionRecall.Recall,
						fScore: precisionRecall.FScore
					});
					console.log('send result');
				}
			},1000);
		});
	});
}


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