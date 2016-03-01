var express = require('express'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  errorhandler = require('errorhandler'),
  morgan = require('morgan'),
  routes = require('./backend'),
  api = require('./backend/api'),
  http = require('http'),
  path = require('path'),
  busboy = require('connect-busboy'), //middleware for form/file upload
  sphinx = require('./backend/sphinx4'),
  kaldi = require('./backend/kaldi'),
  upload = require('./backend/upload'),
  convert = require('./backend/convert'),
  socket = require('./backend/websocket'),
  kaldiCorpus = require('./backend/kaldicorpus'),
  sphinxCorpus = require('./backend/sphinx4corpus'),
  corpus = require('./backend/getcorpus');

var app = module.exports = express();


/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/frontend/views');
app.set('view engine', 'jade');
//app.use(express.limit('4mb'));
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '100mb' }))
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(busboy());

var env = process.env.NODE_ENV || 'development';

// development only
if (env === 'development') {
  app.use(errorhandler());
}

// production only
if (env === 'production') {
  // TODO
}

/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);
// API
app.get('/api/name', api.name);
//transcribe audio by sphinx-4
app.get('/transcribe/Sphinx-4/:inputtype/:clientname', sphinx.transcribeSphinx);
//transcribe audio by kaldi
app.get('/transcribe/Kaldi/:inputtype/:clientname', kaldi.transcribeKaldi);
//transcribe corpus by kaldi
app.get('/transcribecorpus/Kaldi/:corpusName', kaldiCorpus.transcribeCorpusKaldi);
//transcribe corpus by sphinx-4
app.get('/transcribecorpus/Sphinx-4/:corpusName', sphinxCorpus.transcribeCorpusSphinx);
//convert audio
app.get('/convert/:toolname/:inputtype/:clientname', convert.convertAudio);
//send corpus list to client
app.get('/getcorpus', corpus.getCorpus);
//upload file
app.post('/upload/:datatype/:filename', upload.uploadFile);
// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

//convert corpus
/*var exec = require('child_process').exec;
var fs = require('fs-extra');
fs.readdirSync(__dirname+'/corpus/list4/wav-for-kaldi/').forEach(function(audioName){
  var cmd1 = 'cd '+__dirname+'/corpus/list4/wav-for-kaldi/';
  var cmd2 = 'sox '+audioName+' -c 1 -r 8000 -b 16 '+audioName+'-convertedforkaldi.wav';
  console.log(cmd1+' ; '+cmd2);
  exec(cmd1+' ; '+cmd2, function(error, stdout, stderr) {
      console.log('convert ok');
  });
})*/


/**
 * Start Server
 */
var server = http.createServer(app);

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

var initSocket = socket.init(server);

