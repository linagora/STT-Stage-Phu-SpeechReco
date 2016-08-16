"use strict";

//for corpus
exports.transcribeCorpusSphinx = function(req, res) {
	console.log('Sphinx recoie requete: '+req.params.corpusName);
	var fs = require('fs-extra');
	var corpus = req.params.corpusName;
	var corpusFolder = __dirname+'/../corpus/'+corpus+'/';
	var audioFilesFolder = __dirname+'/../corpus/'+corpus+'/wav-for-sphinx/';
	var textFilesFolder = __dirname+'/../corpus/'+corpus+'/txt/';
	var keywordsFolder = __dirname+'/../corpus/'+corpus+'/keywords/';
	var txtName;
	var audioName;
	var listAudio = [];
	var listText =[];
	var listKw =[];
	var lines = fs.readFileSync(corpusFolder+corpus+'.txt').toString().split('\n');
	var listResult = [];
	var time = 0;

	analize();
	/*java.classpath.push(__dirname+"/../target/sphinx-4-lib-1.0-SNAPSHOT-jar-with-dependencies.jar");
	var Configuration = java.import("edu.cmu.sphinx.api.Configuration");
	var configuration = new Configuration();
	configuration.setAcousticModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us");
	configuration.setDictionaryPathSync("resource:/edu/cmu/sphinx/models/en-us/cmudict-en-us.dict");
	configuration.setLanguageModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us.lm.bin");*/
	function analize(){	    
	    lines.forEach(function(line){
	    	var files = line.toString().split(' ');
	    	txtName = files[1];
    		audioName = files[0];
    		listAudio.push(audioFilesFolder+audioName);
    		listText.push(textFilesFolder+txtName);
    		listKw.push(keywordsFolder+txtName);
	    });
	    transcribeBySphinx(listAudio, listText, listKw);
	};	

    //transcribe by sphinx function that give the transcribed text in outpout
	function transcribeBySphinx(listAudio,listText,listKw){
		var java = require('java');
		java.classpath.push(__dirname+'/lib/speechtotext.jar');
		var S2T = java.import('AppTestSpeechReco');
		var appSpeech = new S2T();
		var start = new Date().getTime();
		var results = appSpeech.transcribeSync(listAudio);
		console.log(results);
		process.nextTick(function(){
			res.send(202);
			var end = new Date().getTime();
			var timeExec = (end - start)/(1000*60);
			console.log(timeExec);
			for(var i=0;i<listAudio.length;i++){
				var originalText = fs.readFileSync(listText[i],"UTF-8").toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"");
				console.log('org: '+originalText);
				console.log('result: '+results[i]);
				var tm = require('text-miner');
				var my_corpus = new tm.Corpus([results[i],originalText]).removeWords(tm.STOPWORDS.EN);
				console.log('result after: '+my_corpus.documents[0]);
				console.log('org after: '+my_corpus.documents[1]);
				var resultTable = my_corpus.documents[0].split(' ');
				var textTable = my_corpus.documents[0].split(' ');
				var keywords = getKeywords(listKw[i]);
		    	listResult.push({
		    		Text: textTable,
		    		Result: resultTable,
		    		Keywords: keywords,
		    		Time: timeExec
			    })
		    	if (i === (listAudio.length-1)) {
		    		simplifize(listResult,0);	
		    	}
			}
		});
	}; 
};
function simplifize(listResult,i){
	var socket = require('./websocket.js').getSocket();
	var lemmer =  require('lemmer');
	var calculs = require('./calculs.js');
	var item = listResult[i];
	var resultTable = item.Result;
	var textTable = item.Text;
	var time = item.Time;
	console.log('time: '+item.Time);
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
			var keywords =[];
			item.Keywords.forEach(function(keyword){
				if (keyword!==''&&keyword!==' '){
					keywords.push(keyword.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(' ',''))
				}
			});
			console.log(keywords);
			//lemmatize keywords
			lemmer.lemmatize(keywords, function(err, transformKeywords){
				var precisionRecall = calculs.precisionRecall(resultSimplifize.split(' '), transformKeywords);
				if (i !== (listResult.length-1)){
					if (i===0){
						setTimeout(function(){
							socket.emit('send msg',{
								WER: wer,
								recall: precisionRecall.recall,
								timeExec: 0

							});
							console.log('send result');
							simplifize(listResult,i+1);
						},1000);
					} else{
						socket.emit('send msg',{
							WER: wer,
							recall: precisionRecall.recall,
							timeExec: 0
						});
						console.log('send result');
						simplifize(listResult,i+1);
					}
				}
				else {
					setTimeout(function(){
						socket.emit('send last msg',{
							WER: wer,
							recall: precisionRecall.recall,
							timeExec: time
						});
						console.log('send result');
					},1000);
				}
			});
		});
	});
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