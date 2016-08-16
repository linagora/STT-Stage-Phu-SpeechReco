exports.transcribeCorpus = function(req,res){
  console.log('Kaldi recoie requete: '+req.params.corpusName);
  var corpus = req.params.corpusName;
  var fs = require('fs-extra');
  var socket = require('./websocket.js').getSocket();
  var calculs = require('./calculs.js');
  var lemmer =  require('lemmer');
  var corpusFolder = __dirname+'/../corpus/'+corpus+'/';
  var audioFilesFolder = corpusFolder+'wav-for-kaldi/';
  var textFilesFolder = corpusFolder+'txt/';
  var keywordsFolder = corpusFolder+'keywords/';
  var audioName;
  var lines = fs.readFileSync(corpusFolder+corpus+'.txt').toString().split('\n');
  var output = [];
  var input = [];

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
    if (i!==filePaths.length) {
      var start = new Date().getTime();
      sendRequest(filePaths[i], function (err, results) {
        console.log(filePaths[i])
        var end = new Date().getTime();
        if(err){
          console.log(err);
          return;
        }
        var resultsL = results.length;
        result=results.trans.hypotheses[0].utterance+' ';
        console.log(result)
        output.push({tempExec: results.temp,trans: result});
        transcribe(filePaths,i+1);
      });
    }
    else {
      sendResults(output,0);
    }
  }

  function sendResults(results,i){
    console.log('Audio '+i)
    var result = cleanText(results[i].trans);
    var txtName = (lines[i].toString().split(' '))[1];
    var originalText = cleanText(fs.readFileSync(textFilesFolder+txtName,"UTF-8"));
    var resultTable = result.split(' ');
    var textTable = originalText.split(' ');
    var keywords = getKeywords(keywordsFolder+txtName);
    //send socket to client time by time
    //simplifize
    //lemmer.lemmatize(resultTable, function(err, transformResult){
    lemmer.lemmatize(resultTable, function(err, transformResult){
      var resultSimplifize='';
      transformResult.forEach(function(word){
        if(word!==''&&word!==' ') resultSimplifize+=word+' ';
      });
      console.log("*transcribed*: "+resultSimplifize);
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
          var precisionRecall = calculs.precisionRecall(resultSimplifize.split(' '), transformKeywords);
          if (i !== (lines.length-1)){
            setTimeout(function(){
              socket.emit('send msg', {
                WER: calculs.werCalcul(campare,textSimplifize),
                recall: precisionRecall.recall,
                timeExec: results[i].tempExec
              });
            },2000);
            sendResults(results,i+1);    
          } else {
            setTimeout(function(){
              socket.emit('send last msg', {
                WER: calculs.werCalcul(campare,textSimplifize),
                recall: precisionRecall.recall,
                timeExec: results[i].tempExec
              });
            },2000);
          }
        });
      });
    }); 
  }
}

function cleanText(txt){
  var tm = require('text-miner');
  var my_corpus = new tm.Corpus([txt.replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"")]);
  my_corpus.toLower();
  my_corpus.removeWords(["yeah","yep","mmhmm","mm","um","mhm","ii","[noise]","[laughter]"]);
  my_corpus.clean();
  return my_corpus.documents[0];
}

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

//get keywords
function getKeywords (filePath){
  var fs = require('fs-extra');
  return fs.readFileSync(filePath).toString().split('\n');
}

function sendRequest(file,callback) {
  var opts = {
    sampleRate: 8000,
    maxRequests: 1
  };
  var ffmpeg = require('fluent-ffmpeg');
  var fs = require('fs-extra');
  var request = require('superagent');
  ffmpeg.ffprobe(file, function (err, info) {
    var temp = require('temp');
    var outputfile = temp.path({suffix: '.wav'});
    ffmpeg()
    .on('error', function (err) {
      console.log(err);
    })
    .on('end', function () {
      processClip(outputfile,callback);
    })
    .input(file)
    .output(outputfile)
    .setStartTime(0)
    .duration(info.format.duration)
    .audioFrequency(opts.sampleRate)
    .toFormat('wav')
    .run();
  });
  
  function processClip(clip,done) {
    console.log('process clip '+clip);
    var start = new Date().getTime();
    transcribeClip(clip,function (err, result) {
      var end = new Date().getTime();
      var tempE = (end-start)/(1000*60);
      fs.unlink(clip);
      if (!err) {
        return done(null, {temp: tempE, trans: result});
      }
      console.log(err);
    });
  }

  function transcribeClip(clip,done) {
    fs.readFile(clip, function (err, data) {
      if (err) return done(err);
      request
        .post('http://' + location.hostname + ':8888/client/dynamic/recognize')
        .type('audio/x-wav; rate=' + opts.sampleRate)
        .parse(request.parse.text)
        .send(data)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }        
          var text = res.text;
          if (!text) return done(null, {result: []});
          try {
            done(null, JSON.parse(text));
          } catch (ex) {
            done(ex);
          }
        });
    });
  }};