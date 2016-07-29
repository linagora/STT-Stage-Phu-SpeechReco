"use strict";

exports.transcribeCorpus = function(req,res){
  if (req.params.corpusName === 'voxforge'){
    var sphinx = require('./sphinx4Voxforge.js');
    sphinx.transcribeVoxforge(req,res);
  } else {
    var sphinx = require('./sphinx4corpusbis.js');
    sphinx.transcribeCorpus(req,res);
  }
};