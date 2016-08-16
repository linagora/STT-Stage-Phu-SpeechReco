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
  sphinx = require('./backend/sphinx4bis'),
  //kaldi = require('./backend/kaldi'),
  kaldi = require('./backend/kaldiRealTime'),
  upload = require('./backend/upload'),
  convert = require('./backend/convert'),
  socket = require('./backend/websocket'),
  //kaldiCorpus = require('./backend/kaldicorpus'),
  kaldiCorpus = require('./backend/kaldiRealTimeCorpus'),
  sphinxCorpus = require('./backend/sphinx4'),
  googleApi = require('./backend/googleApiCorpus'),
  gestionCorpus = require('./backend/gestionCorpus');

var app = module.exports = express();
old_console_log = console.log;
console.log = function() {
    if ( process.env.DEBUG === "-debug" ) {
        old_console_log.apply(this, arguments);
    }
}

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
app.post('/transcribe/Kaldi/:inputtype/:clientname', kaldi.transcribeKaldi);
//transcribe corpus by kaldi
app.get('/transcribecorpus/Kaldi/:corpusName', kaldiCorpus.transcribeCorpus);
//transcribe corpus by sphinx-4
app.get('/transcribecorpus/Sphinx-4/:corpusName', sphinxCorpus.transcribeCorpus);
//transcribe corpus by google api
app.get('/transcribecorpus/GoogleApi/:corpusName', googleApi.transcribeCorpus);
//convert audio
app.get('/convert/:toolname/:inputtype/:clientname', convert.convertAudio);
//create folder for corpus
app.get('/getcorpus', gestionCorpus.getCorpus);
//add content
app.get('/addcontent/:corpusname', gestionCorpus.addContent);
//create corpus
app.get('/createcorpus/:corpusname', gestionCorpus.create);
//delete corpus
app.get('/delcorpus/:corpusname',gestionCorpus.delCorpus);
//upload file
app.post('/upload/:datatype/:filename', upload.uploadFile);
app.post('/uploadfiles/:type/:corpus', upload.uploadFiles);
// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

/**
 * Start Server
 */
var server = http.createServer(app);

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

var initSocket = socket.init(server);

