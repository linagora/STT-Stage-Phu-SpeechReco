"use strict";

exports.transcribeCorpus = function(req,res){
  if (req.params.corpusName === 'voxforge'){
    var googleAPI = require('./googleAPIVoxforge.js');
    googleAPI.transcribeVoxforge(req,res);
  } else {
    var googleAPI = require('./googleAPIOtherCorpus.js');
    googleAPI.transcribeCorpus(req,res);
  }
};