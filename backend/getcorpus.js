'use strict';

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