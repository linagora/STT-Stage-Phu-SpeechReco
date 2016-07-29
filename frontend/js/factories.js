angular.module('myApp.factories', []).
	factory('toolSelectedFactory', function(){
		var selectedTool =  {
			tool: [],
			getSelectedTool: function(){
				return selectedTool.tool;
			},
			setSelectedTool: function(toolName){
				(selectedTool.tool).push(toolName);
			},
			rmSelectedTool: function(toolName){
				(selectedTool.tool).splice((selectedTool.tool).indexOf(toolName),1);
			},
			clearList: function(){
				selectedTool.tool = [];
			}
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
	}).
	factory('corpusName',function(){
		var corpusName = {
			value: "",
			setName: function(name){
				corpusName.value = name;
			},
			getName: function(){
				return corpusName.value;
			}
		}
		return corpusName;
	}).
	factory('dataResult',function(){
		return {	
			data: [],
			setValue: function(werValue,recallValue,timeValue){
				for(var i=0;i<this.data.length;i++){
					if(!this.data[i].stat){
						this.data[i].value[0] = werValue;
						this.data[i].value[1] = recallValue;
						this.data[i].value[2] = timeValue;
						this.data[i].stat = true;
						break;
					}
				}
			},
			getValue: function(){
				return this.data;
			},
			clear: function(num){
				this.data = [];
				for(var i=0;i<num;i++) this.data.push({value:[-1,-1,-1], stat: false});
			}
		};
	}).
	factory('seriesDraw',function(){
		return{
			series: [],
			getSeries: function(){
				return this.series;
			},
			setSeries: function(toolName){
				(this.series).push(toolName);
			},
			rmSeries: function(toolName){
				(this.series).splice((this.series).indexOf(toolName),1);
			},
			clearList: function(){
				this.series = [];
			}
		}
	}).
	factory('transcribeFile',function(){
		return{
			file: null,
			getFile:function(){
				return this.file;
			},
			setFile:function(transFile){
				this.file=transFile;
			}
		}
	})
;