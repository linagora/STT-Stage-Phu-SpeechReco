angular.module('myApp.factories', []).
	factory('toolSelectedFactory', function(){
		var selectedTool =  {
			tool:"unknown",
			getSelectedTool: function(){
				return selectedTool.tool;
			},
			setSelectedTool: function(toolName){
				selectedTool.tool = toolName;
			},
		};
		return selectedTool;
	}).
	factory('mySocket', function (socketFactory) {
	  	var myIoSocket = io.connect(location.href.substr(0,location.href.lastIndexOf('/')+1));

		mySocket = socketFactory({
			ioSocket: myIoSocket
		});

		return mySocket;
	}).
	factory('clientDistinct', function(){
		var client = {
			name: "unknown",
			setNameClient: function(name){
				client.name = name;
			},
			getNameClient: function(){
				return client.name;
			},
		};
		return client;
	}).
	factory('choosedCorpus',function(){
		var corpus = {
			name: "unknown",
			setCorpusName: function(corpusName){
				corpus.name = corpusName;
			},
			getCorpusName: function(){
				return corpus.name;
			}
		}
		return corpus;
	})
;