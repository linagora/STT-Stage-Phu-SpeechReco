exports.transcribeKaldi = function(req,res){
  var fs = require('fs-extra');
  var socket = require('./websocket.js').getSocket(); 
  var lemmer =  require('lemmer');  
  var selectedInput = req.params.inputtype;
  var clientName = req.params.clientname;
  //get data necessary which are original text and audio file (record audio or internet audio)
  if (selectedInput === 'audio'){
      var textFile = getData("text", clientName);
  }
  sendMsg(req.body.value.replace(/\[noise\]/g,"").replace(/\[laughter\]/g,"").replace(/mm/g,""));
  res.send(202);

  function sendMsg(result){
    //treat the client request
    switch (selectedInput){ 
      case 'audio':
        if (textFile !== 'error'){ //text file is uploaded
          console.log(textFile);
          var originalText = cleanText(fs.readFileSync(textFile,"UTF-8")); 
          fs.unlinkSync(textFile);
          console.log("kaldiRT renvoie resultat");
          var resultTable = cleanText(result).split(' ');
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
              setTimeout(function(){
                socket.emit('send msg audio', {
                  transcribedText: resultSimplifize,
                  compareObject: campareText(resultSimplifize, textSimplifize),
                  originalTextExport: textSimplifize,
                });
              },2000);
              console.log("kaldiRT fini");
            });
          }); 
        }
        else {//text file is NOT uploaded
          var resultTable = cleanText(result).split(' ');
          lemmer.lemmatize(resultTable, function(err, transformResult){
            var resultSimplifize='';
            transformResult.forEach(function(word){
              resultSimplifize+=word+' ';
            });
            socket.emit('send msg audio', {
              transcribedText: resultSimplifize,
              compareObject: "",
              originalTextExport: "",
            });
          });  
        }   
        break;
      case 'micro':
        //fs.unlinkSync(audioFile);
        console.log("kaldiRT renvoie resultat");
        socket.emit('send msg micro',{
          transcribedText: result
        });
        break;
      default:
        break;
    }
  };
};

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