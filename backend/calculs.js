"use strict";

exports.werCalcul = function(diffObject,orgText){
	var added = 0;
	var removed = 0;
	var subs = 0;
	var N = 0;
	//get removed and added words with diff
	diffObject.forEach(function(part){
		if (part.removed){
			part.value.split(' ').forEach(function(a){
				if(a!==''){
					removed += 1;
				}			
			});
		}
		if (part.added){
			part.value.split(' ').forEach(function(a){
				if(a!==''){
					added += 1;
				}
			})
		}
	});
	//calcul subs = min(added,removed)
	if (removed === added){
		subs = removed;
		removed = 0;
		added = 0;
	} else if (removed<added){
		subs = removed;
		var addedBis = added-removed;
		added = addedBis;
		removed = 0;
	} else {
		subs = added;
		var removedBis = removed-added;
		removed = removedBis;
		added = 0;
	}
	//sum up n
	orgText.split(' ').forEach(function(a){
		if(a!==''){
			N += 1;
		}
	});
	var WER = (removed+added+subs)/N;
	return WER.toFixed(3);
}

exports.precisionRecall = function(result,keywords){
	var truePositives = 0;
	var resultLength = 0;
	//cut off the no character words
	result.forEach(function(mot){
		if (mot !== '' && mot !== ' '){
			resultLength += 1;
		}
	})
	//increment tp whenever a keyword is detected
	keywords.forEach(function(keyword){
		if (result.indexOf(keyword) > -1){
			truePositives += 1;
		}
	})
	//recall = tp/tp+fp = tp/keywordsLength
	var recall = truePositives/keywords.length;
	//prec = tp/(tp+fn) = tp/kw dans result
	//var prec = truePositives/resultLength;
	//F1-score
	//var fScore = (2*precision*recall)/(precision+recall);
	return {
		recall: recall.toFixed(3)
	}
}