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
				//console.log('removed:'+a+'/');
				if(a!==''){
					removed += 1;
				}			
			});
		}
		if (part.added){
			part.value.split(' ').forEach(function(a){
				//console.log('added:'+a+'/');
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
	//sum up in
	orgText.split(' ').forEach(function(a){
		if(a!==''){
			N += 1;
		}
	});
	console.log("For WER calcul");
	console.log('removed = '+removed);
	console.log('added = '+added);
	console.log('subs = '+subs);
	console.log('N = '+N);
	var WER = (removed+added+subs)/N;
	return WER.toFixed(3);
}

exports.precisionRecall = function(diffObject){
	var added = 0;
	var removed = 0;
	var right = 0;
	var N = 0;
	//get removed and added words with diff
	diffObject.forEach(function(part){
		if (part.removed){
			part.value.split(' ').forEach(function(a){
				//console.log('removed:'+a+'/');
				if(a!==''){
					removed += 1;
				}			
			});
		}
		else if (part.added){
			part.value.split(' ').forEach(function(a){
				//console.log('added:'+a+'/');
				if(a!==''){
					added += 1;
				}
			});
		}
		else {
			part.value.split(' ').forEach(function(a){
				//console.log('right:'+a+'/');
				if(a!==''){
					right += 1;
				}
			})
		}
	});
	//console.log("For precision-recall calcul");
	//console.log('removed = '+removed);
	//console.log('added = '+added);
	//console.log('right = '+right);
	//precision = tp/(tp+fp)
	var precision = right/(right+added);
	//recall = tp/(tp+fn)
	var recall = right/(right+removed);
	//F1-score
	var fScore = (2*precision*recall)/(precision+recall);
	return {
		Precision: precision.toFixed(3),
		Recall: recall.toFixed(3),
		FScore: fScore.toFixed(3)
	}
}