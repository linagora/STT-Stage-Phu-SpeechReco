exports.transcribeCorpus = function(req,res){
  if (req.params.corpusName === 'voxforge'){
    var kaldi = require('./testKaldiVoxforge.js');
    kaldi.transcribeVoxforge(req,res);
  } else {
    var kaldi = require('./testKaldiOtherCorpus.js');
    kaldi.transcribeCorpus(req,res);
  }
};