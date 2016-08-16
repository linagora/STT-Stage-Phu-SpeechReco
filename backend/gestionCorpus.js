'use strict';

exports.create = function(req,res){
	var corpusName = req.params.corpusname;
	var  fs = require('fs-extra');
	var corpusDir = __dirname+'/../corpus/'+corpusName;
	if(fs.exists(corpusDir)){
		res.json('Change your corpus name, this name was used');
	} else{
		fs.mkdirSync(corpusDir);
		fs.writeFileSync(corpusDir+'/'+corpusName+'.txt', "");
		fs.mkdirSync(corpusDir+'/keywords/');
		fs.mkdirSync(corpusDir+'/wav-for-kaldi/');
		fs.mkdirSync(corpusDir+'/wav-for-sphinx/');
		fs.mkdirSync(corpusDir+'/wav/');
		fs.mkdirSync(corpusDir+'/txt/');
		res.json('Name Valide');
	}
}
 
exports.addContent = function(req,res){
	var  fs = require('fs-extra');
	var corpusName = req.params.corpusname;
	var corpusDir = __dirname+'/../corpus/'+corpusName+'/wav/';
	var txt = __dirname+'/../corpus/'+corpusName+'/'+corpusName+'.txt';
	var textDir = __dirname+'/../corpus/'+corpusName+'/txt/';
	var kwDir = __dirname+'/../corpus/'+corpusName+'/keywords/';
	console.log(corpusDir);
	var files = fs.readdirSync(corpusDir);
	files.forEach(function(file){
		var textName = file.replace('.wav','')+'.txt';
		if (files.indexOf(file) < (files.length-1)){			
			var line = file+' '+textName+'\n';
			fs.appendFile(txt, line, function (err) {
		        if (err) return console.log(err);
		        convert(file,corpusName);
		        createKW(textDir+textName,kwDir+textName);
		    });
		} else {
			var line = file+' '+textName;
			fs.appendFile(txt, line, function (err) {
		        if (err) return console.log(err);
		        convert(file,corpusName);
		        createKW(textDir+textName,kwDir+textName);
		    });
		}
	});
	res.end();
}

//verifie if all required contents exist
function verifieContent(corpusName){
	var  fs = require('fs-extra');
	var result = true;
	var corpusDir = __dirname+'/../corpus/'+corpusName+'/';
	var txtDir = corpusDir+'txt/';
	var kwDir = corpusDir+'keywords/';
	var lines = fs.readFileSync(corpusDir+corpusName+'.txt').toString().split('\n');
	lines.forEach(function(line){
		var files = line.toString().split(' ');
    	var txtName = files[1];
    	if (!fs.exists(txtDir+txtName) || !fs.exists(kwDir+txtName)){
    		result = false;
    	} 
	})
	return result;
}

exports.delCorpus = function(req, res){
	var  fs = require('fs-extra');
	var corpusName = req.params.corpusname;
	var corpusDir = __dirname+'/../corpus/'+corpusName+'/';
	console.log(corpusDir);
	deleteFolderRecursive(corpusDir);
	res.end();
}

function deleteFolderRecursive(path) {
	var  fs = require('fs-extra');
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

exports.getCorpus = function(req, res) {
	var fs =require('fs-extra');
	var corpusFolder = __dirname+'/../corpus/';
	if (fs.existsSync(corpusFolder)) {
		var corpusList = fs.readdirSync(corpusFolder);
		var data =[];
		corpusList.forEach(function(corpus){
			if (fs.lstatSync(corpusFolder+corpus).isDirectory()) {
				data.push(corpus);
			}
		});
  		res.json(data);
	} else {
		fs.mkdirSync(corpusFolder);
		res.json([]);
	}
};

//convert file in wav to wav-for-kaldi and for-sphinx
function convert(audioName,corpusName){
	var  fs = require('fs-extra');
	var corpusDir = __dirname+'/../corpus/'+corpusName+'/wav/';
    var ffmpeg = require('fluent-ffmpeg');
    var file = corpusDir + '/' + audioName;
    var outputKaldi = __dirname+'/../corpus/'+corpusName+'/wav-for-kaldi/'+audioName.replace(/mp3/,"wav");
    var outputSphinx= __dirname+'/../corpus/'+corpusName+'/wav-for-sphinx/'+audioName.replace(/mp3/,"wav");
    ffmpeg.ffprobe(file, function (err, info) {
        ffmpeg()
        .on('error', function (err) {
            console.log(err);
        })
        .on('end', function () {
        	ffmpeg.ffprobe(file, function (err, info) {
		        ffmpeg()
		        .on('error', function (err) {
		            console.log(err);
		        })
		        .on('end', function () {
		        	console.log("convert ok")
		        })
		        .input(file)
		        .output(outputSphinx)
		        .setStartTime(0)
		        .duration(info.format.duration)
		        .audioFrequency(16000)
		        .toFormat('wav')
		        .run();
		    });
        })
        .input(file)
        .output(outputKaldi)
        .setStartTime(0)
        .duration(info.format.duration)
        .audioFrequency(8000)
        .audioChannels(1)
        .audioBitrate(16)
        .toFormat('wav')
        .run();
    });
}

function createKW(fileTxt,fileKw){
	var  fs = require('fs-extra');
	var words = readFileTxt(fileTxt);
	var k = randomIntFromInterval(words.length/2,words.length);
	shuffle(words);
	var i;
	for (i=0;i<k;i++){
		fs.appendFile(fileKw, words[i]+'\n', function (err) {
	        if (err) return console.log(err);
	    });
	}

	function shuffle(a) {
	    var j, x, i;
	    for (i = a.length; i; i -= 1) {
	        j = Math.floor(Math.random() * i);
	        x = a[i - 1];
	        a[i - 1] = a[j];
	        a[j] = x;
	    }
	}	
	function randomIntFromInterval(min,max){
	    return Math.floor(Math.random()*(max-min+1)+min);
	}

	function readFileTxt(fileTxt){
		var text = cleanText(fs.readFileSync(fileTxt).toString().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()\[\]]/g,""));
		var tab = text.split(' ');
		return tab;
	}

	function cleanText(txt){
		var tm = require('text-miner');
		var my_corpus = new tm.Corpus([txt]);
		my_corpus.toLower();
		my_corpus.removeWords(["ain't","aren't","can't","couldn't","didn't","doesn't","don't","hadn't","hasn't","haven't","here's","i'd","i'll","i'm","i've","isn't","it'd","it'll","it's","let's","shouldn't","that's","there's","they'd","they'll","they're","they've","wasn't","we'd","we'll","we're","we've","weren't","what's","where's","won't","wouldn't","you'd","you'll","you're","you've","he's","who's"]);
		my_corpus.removeWords(["yeah","yep","mmhmm","mm","um","mhm","ii"]);
		my_corpus.removeWords(tm.STOPWORDS.EN);
		my_corpus.clean();
		return my_corpus.documents[0];
	}
}