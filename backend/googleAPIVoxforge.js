exports.transcribeVoxforge = function(req,res){
  console.log('Kaldi recoie requete: '+req.params.corpusName);
  var corpus = req.params.corpusName;
  var fs = require('fs-extra');
  var socket = require('./websocket.js').getSocket();
  var calculs = require('./calculs.js');
  var lemmer =  require('lemmer');

  res.send(202);
  var corpusFolder = __dirname+'/../corpus/voxforge/';
  var output = [];

  fs.readdir(corpusFolder,function(err, spkList){
    if (err) {
      console.log(err);
      return;
    }
    scanSpk(spkList,0);
  });

  function scanSpk(spkList,i){
    var fs = require('fs-extra');
    if (i!==spkList.length) {
      if(fs.lstatSync(corpusFolder+spkList[i]).isDirectory()){
        fs.readFile(corpusFolder+spkList[i]+'/etc/prompts-original','utf-8',function(err,textList){
          console.log(textList);
          transcribe(corpusFolder+spkList[i]+'/wav/',textList.split('\n'),0,i+1,spkList,scanSpk);
        })
      }else scanSpk(spkList,i+1);
    } else {
      sendResults(output,0)
    }
  };

  function transcribe(folder,textList,i,numSpk,spkList,callback){
    if (i!==textList.length && textList[i]!=='') {
      var fileName = (textList[i].substr(0,textList[i].indexOf(' ',0))).replace(/[*\/]/g,"")+'.wav';
      sendRequest(folder+fileName, function (err, results) {
        if(err){
          console.log(err);
          return;
        }
        var result=results.trans.result[0].alternative[0].transcript;
        console.log(result);
        var org = textList[i].substr(textList[i].indexOf(' ',0)+1);
        output.push({text:org,tempExec:results.temp,trans:result.replace(/\[noise\]/g,"").replace(/\[laughter\]/g,"").replace(/mm/g,"")});
        console.log(result.replace(/\[noise\]/g,"").replace(/\[laughter\]/g,"").replace(/mm/g,""));
        transcribe(folder,textList,i+1,numSpk,spkList,callback);
      });
    }
    else {
      callback(spkList,numSpk);
    }
  }
 
  function sendResults(results,i){
    console.log('Audio '+i)
    var result = results[i].trans;
    var originalText = results[i].text.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    var resultTable = result.replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(' ');
    var textTable = originalText.split(' ');
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
        console.log("*org*: "+textSimplifize);
        var campare = campareText(resultSimplifize, textSimplifize);
        if (i !== (results.length-1)){
          socket.emit('send msg', {
            WER: calculs.werCalcul(campare,textSimplifize),
            recall:0,
            timeExec: results[i].tempExec
          });
          sendResults(results,i+1);    
        } else {
          socket.emit('send last msg', {
            WER: calculs.werCalcul(campare,textSimplifize),
            recall:0,
            timeExec: results[i].tempExec
          });
        }
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

function sendRequest(file,callback) {
  console.log(file);
  var opts = {
    key: 'AIzaSyCA9K61DkVf8iO3br_LgrSEtoq1ZL8q3uA',
    sampleRate: 8000,
    lang: 'en-US',
    maxResults: 1,
    pfilter: 1
  };
  var ffmpeg = require('fluent-ffmpeg');
  var fs = require('fs-extra');
  var request = require('superagent');
  ffmpeg.ffprobe(file, function (err, info) {
    var outputfile = 'tmp.flac';
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
    .toFormat('flac')
    .run();
  });
  
  function processClip(clip,done) {
    //console.log(clip);
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
        .post('https://www.google.com/speech-api/v2/recognize')
        .type('audio/x-flac; rate=' + opts.sampleRate)
        .query({key: opts.key})
        .query({lang: opts.lang})
        .query({maxResults: opts.maxResults})
        .query({pfilter: opts.pfilter ? 1 : 0})
        .parse(request.parse.text)
        .send(data)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }          
          var text = res.text;
          console.log(text);
          if (text) text = text.split('\n')[1];
          if (!text) return done(null, {result: []});
          try {
            done(null, JSON.parse(text));
          } catch (ex) {
            done(ex);
          }
        });
    });
  }
};