'use strict';

/* Directives */
angular.module('myApp.directives', ['chart.js']).
	directive('appName', function(appname) {
		return function(scope, elm, attrs) {
		  elm.text(appname);
		};
	}).
	//the drag zone the choose file
	directive('dragBox', function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/drag-box',
			controller: function($scope, Upload, clientDistinct){
				var el = document.querySelector('#drop');
				el.ondragover = function() {
					this.className = "hover";
					this.innerHTML = "Drop the file";
					return false;
				}
				el.ondragleave =  function(){
					this.className = "";
					this.innerHTML = "Drop your file here";
					return false;
				}
				el.ondrop = function(e){
					e.preventDefault();
					this.className="";
					this.innerHTML = "Drop your file here";
					var uploadFile = e.dataTransfer.files[e.dataTransfer.files.length-1];
					$scope.uploadByDragging(uploadFile);					
				}
				//upload funtion uses the Upload object and upload methode of angular-file-upload
				$scope.uploadByDragging = function (file) {
					$scope.convertMsg='';
					console.log(clientDistinct.getNameClient());
            		if (clientDistinct.getNameClient() === 'unknown'){
            			clientDistinct.setNameClient(getRandomString());
            		}
					if (file.type === "audio/wav"){
			        	$scope.uploadAudioStatus=file.name+" was uploaded";
			        	var filename = clientDistinct.getNameClient()+'.wav';
			        	Upload.upload({
				            url: 'upload/stream/'+filename,
				            method: 'POST',
				            file: file
			        	});
			        }
			        else if (file.type === "text/plain"){
			        	$scope.uploadTextStatus=file.name+" was uploaded";
			        	var filename = clientDistinct.getNameClient()+'.txt';
			        	Upload.upload({
				            url: 'upload/stream/'+filename,
				            method: 'POST',
				            file: file
			        	});
            		}
			    };
			},
		}
		//fonction create random name
		function getRandomString() {
		  	if (window.crypto) {
			    var a = window.crypto.getRandomValues(new Uint32Array(3)),
			    token = '';
			    for (var i = 0, l = a.length; i < l; i++) token += a[i].toString(36);
			    return token;
		  	} else {
		    	return (Math.random() * new Date().getTime()).toString(36).replace( /\./g , '');
		  	}
		};
	}).
	//choose file by button
	directive('chooseFile', function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/choose-file',
			controller: function($scope, Upload, clientDistinct, transcribeFile, toolSelectedFactory){
				$scope.uploadAudioStatus="";
				$scope.uploadTextStatus="";
				var filename = "";
                $scope.upload = function (file) {
                	$scope.convertMsg='';
	                if(file !== null){
	                	if (toolSelectedFactory.getSelectedTool()[0] === 'Kaldi'){
	                		if (clientDistinct.getNameClient() === 'unknown'){
		                		clientDistinct.setNameClient(getRandomString());
		                	}
	                		if (file.type === "text/plain"){
					        	$scope.uploadTextStatus=file.name+" was uploaded";
					        	filename = clientDistinct.getNameClient()+'.txt';
					        	Upload.upload({
						            url: 'upload/stream/'+filename,
						            method: 'POST',
						            file: file
					        	});
		            		} else {
		            			$scope.uploadAudioStatus=file.name+" was uploaded";
	                			transcribeFile.setFile(file);
		            		}
	                	}
	                	else{
	                		console.log(clientDistinct.getNameClient());
	                		if (clientDistinct.getNameClient() === 'unknown'){
	                			clientDistinct.setNameClient(getRandomString());
	                		}
		                	if (file.type === "audio/wav"){
					        	$scope.uploadAudioStatus=file.name+" was uploaded";
					        	filename = clientDistinct.getNameClient()+'.wav';
					        	Upload.upload({
						            url: 'upload/stream/'+filename,
						            method: 'POST',
						            file: file
					        	});
					        }
					        else if (file.type === "text/plain"){
					        	$scope.uploadTextStatus=file.name+" was uploaded";
					        	filename = clientDistinct.getNameClient()+'.txt';
					        	Upload.upload({
						            url: 'upload/stream/'+filename,
						            method: 'POST',
						            file: file
					        	});
		            		}
					    }
                	}
			    }; 
			}
		}
		//fonction create random name
		function getRandomString() {
		  if (window.crypto) {
		    var a = window.crypto.getRandomValues(new Uint32Array(3)),
		    token = '';
		    for (var i = 0, l = a.length; i < l; i++) token += a[i].toString(36);
		    return token;
		  } else {
		    return (Math.random() * new Date().getTime()).toString(36).replace( /\./g , '');
		  }
		};
	}).
	//choose tool directive links to choose-tool template
	directive('chooseTool', function(){
		return {
			restrict: 'EA',
			templateUrl: 'partials/choose-tool',
			controller: function($scope, toolSelectedFactory, dataResult, seriesDraw){
				var inputType = location.href.substr(location.href.lastIndexOf('/'));
    			$scope.tools = ["Sphinx-4","Kaldi","GoogleApi"];
    			toolSelectedFactory.clearList();
    			$scope.selectionTool = toolSelectedFactory.getSelectedTool();
    			//update the tool variable and the link variable in toolSelectedFactory. 
    			//The transcribe directive will use the link variable to send request to server
    			$scope.setTool = function(tool){
    				switch (inputType) {
    					case "/corpus":
    						if (toolSelectedFactory.getSelectedTool().length === 0){
    							seriesDraw.clearList();
    						}
	    					if (toolSelectedFactory.getSelectedTool().indexOf(tool) > -1){
		    					toolSelectedFactory.rmSelectedTool(tool);
		    					seriesDraw.rmSeries(tool);
		    					$scope.selectionTool = toolSelectedFactory.getSelectedTool();
		    				}
			      			else {
			      				toolSelectedFactory.setSelectedTool(tool);
			      				seriesDraw.setSeries(tool);
			      				$scope.selectionTool = toolSelectedFactory.getSelectedTool();
			      			}
			      			break;
			      		case "/audiofile":
			      			toolSelectedFactory.clearList();
			      			toolSelectedFactory.setSelectedTool(tool);
		      				$scope.selectionTool = toolSelectedFactory.getSelectedTool();
		      				break;
		      			case "/yourmicro":
			      			toolSelectedFactory.clearList();
			      			toolSelectedFactory.setSelectedTool(tool);
		      				$scope.selectionTool = toolSelectedFactory.getSelectedTool();
		      				break;
		      			default:
		      				break;
    				};
				};
			}
		}
	}).
	//transcribe directive that sent request of transcribing audio to server
	directive('transcribeAudio',function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/transcribe-audio',
			controller: function($scope, $http, toolSelectedFactory, mySocket, clientDistinct,transcribeFile){
				//scope.isShow decide show or hide the loading icon and the transcribe text part
				//isShow = false => transcribe text part is showed and loading icon is hided
				$scope.isShow = false;
				var transcribeButton = document.getElementById('transcribe-button');
			
				//take result if it's sent by socket (for kaldi case)
				mySocket.on('send msg audio',function(data){	
					$scope.isShow = false;
					$scope.transcribedText = data.transcribedText;
					//affichage de comparaison
					if (data.compareObject !== undefined){
					  if (data.compareObject !== ""){
					      var display = document.getElementById("compareObject");
					      display.innerHTML = "&bull; Compare text here : ";
					      data.compareObject.forEach(function(part){
					        // green for additions, red for deletions
					        // black for common parts
					        var color = part.added ? 'green' :
					          part.removed ? 'red' : 'black';
					        var span = document.createElement('span');
					        span.style.color = color;
					        span.appendChild(document.createTextNode(part.value));
					        if (part.removed) span.appendChild(document.createTextNode(' '));
					        display.appendChild(span);
					      });
					      $scope.originalText = data.originalTextExport;
					   }
					   else {
					   		$scope.originalText = "Missing!!";
					   		var display = document.getElementById("compareObject");
						    display.innerHTML = "Text file is missing so we can not campare it";
					   }
					}
					
					transcribeButton.removeAttribute("disabled");
				});	
				mySocket.on('send error audio', function(data){
					$scope.isShow = false;
					$scope.transcribedText = data.transcribedText;
					var display = document.getElementById("compareObject");
					display.innerHTML = "";
					$scope.originalText = "";
					transcribeButton.removeAttribute("disabled");
				});

				//function executes when clicking transcribe button
				$scope.transcribeRequest =function (){
					var tool = toolSelectedFactory.getSelectedTool()[0];
					//if tool is not choosen, just give the error msg and end
					if (toolSelectedFactory.getSelectedTool()===[]) {
						$scope.errorMessage = "Choose a toolkit before!";
						return 0;
					}; 
					//if the toolkit is kaldi, create a socket to server
					if (tool === "Kaldi"){
						mySocket.connect('http://' + location.hostname + ':8080/',{'forceNew':true });
					}
					//if the toolkit is sphinx-4, disconnect the socket
					if (tool === "Sphinx-4"){
						mySocket.disconnect();
						console.log('socket disconnected');
					}
					//reset error message
					$scope.errorMessage ="";
					//disable the transcribe button to make sure client can not click it twice
					transcribeButton.setAttribute("disabled", true);
					//show loading icon and hide the transcribe zone
					$scope.isShow = true;						
					//reset all part of transcribe template
					document.getElementById("compareObject").innerHTML = "&bull; Compare text here :";
					$scope.transcribedText = "";
					$scope.originalText = "";
					//send request to server
					if (tool === 'Kaldi'){
						var ws = new WebSocket("ws://' + location.hostname + ':8888/client/ws/speech");
						var transFinal = "";
						ws.onopen = function (event) {
							console.info('open');
							ws.send(transcribeFile.getFile()); 
							ws.send("EOS");
						};

						ws.onclose = function (event) {
							console.info('close');
							console.log(transFinal)
							//send transcribed text to server to receive compare text
							$http({
					      		method: 'POST',
					      		url: '/transcribe/'+tool+'/audio/'+clientDistinct.getNameClient(),
					      		data: {value: transFinal},
					      		headers: { 'Content-Type': 'application/json' }
						    }).
						    success(function(data, status, headers, config) {
						      	console.log('requete accepte');
						      	mySocket.connect('http://' + location.hostname + ':8080/',{'forceNew':true });
						    }).
						    error(function(data, status, headers, config) {
						      	$scope.transcribedText = 'Error!';
						      	transcribeButton.removeAttribute("disabled");
						    });
						};

						ws.onerror = function (event) {
							console.info('error');
						};
						var old="&bull; Transcribed text here: ";
						ws.onmessage = function (event) {
							var hyp = JSON.parse(event.data);
							if (hyp.result != undefined){
								var trans = hyp.result.hypotheses[0].transcript;
								if (JSON.parse(event.data).result.final){
									transFinal += trans+' ';
									document.getElementById("transcribedText").innerHTML = old+trans+' ';
									old = document.getElementById("transcribedText").innerHTML.toString();
								}
								else document.getElementById("transcribedText").innerHTML = old + trans;
							}
						}
					} else {
						$http({
					      	method: 'GET',
					      	url: '/transcribe/'+tool+'/audio/'+clientDistinct.getNameClient()
					    }).
					    success(function(data, status, headers, config) {
					      	console.log('requete accepte');
					      	if (tool === "Sphinx-4"){
					      		mySocket.connect('http://' + location.hostname + ':8080/',{'forceNew':true });
					      	}
					    }).
					    error(function(data, status, headers, config) {
					      	$scope.transcribedText = 'Error!';
					      	$scope.isShow = false;
					      	transcribeButton.removeAttribute("disabled");
					    });
					}
				}	
			},
		}
	}).
	directive('transcribeMicro', function(){
		return{
			restrict: 'E',
			templateUrl: 'partials/transcribe-micro',
			controller: function($scope, $http, toolSelectedFactory, mySocket, clientDistinct){
				var tool = toolSelectedFactory.getSelectedTool()[0];
				//scope.isShow decide show or hide the loading icon and the transcribe text part
				//isShow = false => transcribe text part is showed and loading icon is hided
				$scope.isShow = false;
				var transcribeButton = document.getElementById('transcribe-button');

				//take result if it's sent by socket (for kaldi case)
				mySocket.on('send msg micro',function(data){	
					$scope.isShow = false; 
					$scope.errorMessage=""; 
					console.log(data.transcribedText);
					$scope.transcribedText = data.transcribedText;
					transcribeButton.removeAttribute("disabled");
				})

				//function executes when clicking transcribe button
				$scope.transcribeRequest =function (){
					//if tool is not choosen, just give the error msg and end
					if (toolSelectedFactory.getSelectedTool()===[]) {
						$scope.errorMessage = "Choose a toolkit before!";
						return 0;
					};
					//if the toolkit is kaldi, create a socket to server
					if (tool === "Kaldi"){
						mySocket.connect('http://' + location.hostname + ':8080/',{'forceNew':true });
					}
					//if the toolkit is sphinx-4, disconnect the socket
					if (tool === "Sphinx-4"){
						mySocket.disconnect();
					}
					$scope.errorMessage="";
					//disable the transcribe button to make sure client can not click it twice
					transcribeButton.setAttribute("disabled", true);

					//clear error message and show loading icon
					$scope.errorMessage ="";
					$scope.isShow = true;
					//sent request
					$http({
				      method: 'GET',
				      url: '/transcribe/'+tool+'/micro/'+clientDistinct.getNameClient()
				    }).
				    success(function(data, status, headers, config) {
				      	if (tool === "Sphinx-4"){
					      	mySocket.connect('http://' + location.hostname + ':8080/',{'forceNew':true });
					    }
				    }).
				    error(function(data, status, headers, config) {
				      	$scope.transcribedText = 'Error!';
				      	$scope.isShow = false;
				      	transcribeButton.removeAttribute("disabled");
				    });
				}
			}
		}
	}).
	//record audio application
	directive('audioRecord',function(){
		return{
			restrict:'E',
			templateUrl: 'partials/audio-record',
			controller: function($scope, $http, clientDistinct, toolSelectedFactory){
				//configuration of the recorder
				var RECORDER_WORKER_PATH = '../components/record/recorderWorker.js';
				var recorder;
				var audioContext;
				// Initialized by startListening()
				var ws;
				var intervalKey;
				var init = function() {
					var audioSourceConstraints = {};
					try {
						window.AudioContext = window.AudioContext || window.webkitAudioContext;
						navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
						window.URL = window.URL || window.webkitURL;
						audioContext = new AudioContext();
					} catch (e) {
						// Firefox 24: TypeError: AudioContext is not a constructor
						// Set media.webaudio.enabled = true (in about:config) to fix this.
						console.log("Error initializing Web Audio browser: " + e);
					}

					if (navigator.getUserMedia) {
						audioSourceConstraints.audio = true;
						navigator.getUserMedia(audioSourceConstraints, startUserMedia, function(e) {
							console.log("No live audio input in this browser: " + e);
						});
					} else {
						console.log("No user media support");
					}
				}
				// Private methods
				function startUserMedia(stream) {
					var input = audioContext.createMediaStreamSource(stream);
					// make the analyser available in window context
					window.userSpeechAnalyser = audioContext.createAnalyser();
					input.connect(window.userSpeechAnalyser);

					//config.rafCallback();

					recorder = new Recorder(input, { workerPath : RECORDER_WORKER_PATH });
					console.log('Recorder initialized');
				}

				var startListening = function() {
					if (! recorder) {
						console.log("Recorder undefined");
						return;
					}

					try {
						ws = createWebSocket();
					} catch (e) {
						console.log("No web socket support in this browser!");
					}
				}

				// Stop listening, i.e. recording and sending of new input.
				var stopListening = function() {
					// Stop the regular sending of audio
					clearInterval(intervalKey);
					// Stop recording
					if (recorder) {
						recorder.stop();
						console.log('Stopped recording');
						// Push the remaining audio to the server
						recorder.export16kMono(function(blob) {
							socketSend(blob);
							recorder.clear();
						}, 'audio/x-raw');
					} else {
						console.log("Recorder undefined");
					}
				}

				var createWebSocket = function(){
					var old="&bull; Transcribed text here: ";
					var ws = new WebSocket("ws://' + location.hostname + ':8888/client/ws/speech?content-type=audio/x-raw,+layout=(string)interleaved,+rate=(int)16000,+format=(string)S16LE,+channels=(int)1");
					ws.onopen = function () {
						intervalKey = setInterval(function() {
							recorder.export16kMono(function(blob) {
								socketSend(blob);
							}, 'audio/x-raw');
							req++;
						}, 5000);
						// Start recording
						recorder.record();
					};
					ws.onclose = function () {
						console.info('close');
					};
					ws.onerror = function () {
						console.info('error');
					};
					ws.onmessage = function () {
						var hyp = JSON.parse(event.data);
						console.log(hyp);
						messF++
						if (hyp.result != undefined){
							var trans = hyp.result.hypotheses[0].transcript;
							if (JSON.parse(event.data).result.final){
								document.getElementById("transcribedText").innerHTML = old+trans+' ';
								old = document.getElementById("transcribedText").innerHTML.toString();
							}
							else document.getElementById("transcribedText").innerHTML = old + trans;
						}
					}
					return ws;
				}
				var socketSend = function(item){
					if (ws) {
						var state = ws.readyState;
						if (state===1) {
							// If item is an audio blob
							if (item instanceof Blob) {
								if (item.size > 0) {
									ws.send(item);
									console.log('Send: blob: ' + item.type + ', ' + item.size + item);
								} else {
									console.log('Send: blob: ' + item.type + ', EMPTY');
								}
							// Otherwise it's the EOS tag (string)
							} else {
								ws.send(item);
								console.log('Send tag: ' + item);
							}
						} else {
							console.log('WebSocket: readyState!=1: ' + state + ": failed to send: " + item);
						}
					} else {
						console.log('No web socket connection: failed to send: ' + item);
					}
				}
				/*****************************************************************************************/
				var startRecording = document.getElementById('start-recording');
				var stopRecording = document.getElementById('stop-recording');
				var audioPreview = document.getElementById('audio-preview');
				var audio = document.querySelector('audio');
				var recordAudio;
				var audioRecordedFile;
				var intervalSend;
				var messF = 0;
				var req = 0;
				init();
				//when stat recording
				startRecording.onclick = function() {
					messF = 0;
					req = 0;
					if (toolSelectedFactory.getSelectedTool()[0]==="Kaldi"){
						startListening();
						startRecording.disabled = true;
	      				stopRecording.disabled = false;					
					} else if(toolSelectedFactory.getSelectedTool()[0]==="Sphinx-4"){
						startRecording.disabled = true;
						document.getElementById('recordStatus').innerHTML="";
						navigator.getUserMedia = ( navigator.getUserMedia ||
	                       navigator.webkitGetUserMedia ||
	                       navigator.mozGetUserMedia ||
	                       navigator.msGetUserMedia);
						navigator.getUserMedia({
					        	audio: true
					    	}, 
					    	function(stream) {
					    		//Record RTC is an object in recordrtc component of angular
					        	recordAudio = RecordRTC(stream, {
					        	    bufferSize: 16384,
									type: 'audio'
					        	});
					        	recordAudio.startRecording();
					    	}, 
					    	function(error) {
	            				alert(JSON.stringify(error));
	        				}	
	        			);
	      				stopRecording.disabled = false;	
					}
				};
				stopRecording.onclick = function() {
					if (toolSelectedFactory.getSelectedTool()[0]==="Kaldi"){
						socketSend('EOS');
						stopListening();
						console.log(req+'-'+messF);
						stopRecording.disabled = true;
					    startRecording.disabled = false;
					} else if(toolSelectedFactory.getSelectedTool()[0]==="Sphinx-4"){
						recordAudio.stopRecording(function() {
	        				recordAudio.getDataURL(function(audioDataURL) {
	            				//postFiles(audioDataURL);
				                audioRecordedFile = {
				            		type: 'audio/wav',
				            		contents: audioDataURL
				    			};
				    			//play preview
				    			audioPreview.src = audioDataURL;
	                    		audioPreview.play();

	                    		//post file
	                    		clientDistinct.setNameClient(getRandomString());
	                    		$http({
					      			method: 'POST',
					      			url: '/upload/file/'+clientDistinct.getNameClient(),
									data: JSON.stringify(audioRecordedFile)
					    		}).
	                    		success(function(data, status, headers, config) {
	                    			console.log("sent ok");
	                    		}).
	                    		error(function(data, status, headers, config) {
					      			console.log('Error!');
					    		});
					    		//clear button and update message after recording
					    		stopRecording.disabled = true;
					    		startRecording.disabled = false;
					    		document.getElementById('recordStatus').innerHTML = "Your recording was saved on my server"+"<br>" 
					    		+"Now, you could choose a toolkit and click transcribe button to transcribe it or listen to the preview above";
			    			});
	    				});
					}
                };
				//fonction create random name for each recorded audio file
				function getRandomString() {
	                if (window.crypto) {
	                    var a = window.crypto.getRandomValues(new Uint32Array(3)),
	                        token = '';
	                    for (var i = 0, l = a.length; i < l; i++) token += a[i].toString(36);
	                    return token;
	                } else {
	                    return (Math.random() * new Date().getTime()).toString(36).replace( /\./g , '');
	                }
	            };
	        }		
		};
	}).
	directive('chooseInput',function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/choose-input',
			controller: function($scope, $http){
				$scope.chooseValue = 0;
			    $scope.link ="";
			    $scope.chooseOptions = [{value:1,name:"Audio File"},{value:2,name:"Your micro"},{value:3,name:"Corpus"}];//pas encore choisir
			    $scope.setValue = function(option){
			      $scope.chooseValue = option.value;
			    };
			    $scope.setLink = function(value){
			      switch (value) {
			        case 1 :
			          $scope.link ="audiofile";
			          break;
			        case 2 :
			          $scope.link ="yourmicro";
			          break;
			        case 3 :
			          $scope.link ="corpus";
			          break;
			        default:
			          $scope.link ="";
			          break;
			      };
				}
			}
		};
	}).
	directive('convertAudio',function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/convert-audio',
			controller: function($scope, $http, toolSelectedFactory, clientDistinct){
				$scope.showIcon = false;
				$scope.convertMsg;
			    $scope.convertAudio = function(){
			    	$scope.convertMsg ="";
			    	if (toolSelectedFactory.getSelectedTool() !== 'unknown'){
				    	$scope.showIcon = true;
				    	var toolName = toolSelectedFactory.getSelectedTool();
						var inputType = location.href.substr(location.href.lastIndexOf('/'));
						console.log('/convert/'+toolName+inputType+'/'+clientDistinct.getNameClient());
				    	$http({
			      			method: 'GET',
			      			url: '/convert/'+toolName+inputType+'/'+clientDistinct.getNameClient(),
			    		}).
	            		success(function(data, status, headers, config) {
	            			$scope.showIcon = false;
	            			console.log(data.convertMsg);
	            			$scope.convertMsg = data.convertMsg;
	            		}).
	            		error(function(data, status, headers, config) {
	            			$scope.showIcon = false;
	            			$scope.convertMsg = data.convertMsg;
			      			console.log('Error!');
			    		});
	            	}
	            	else $scope.convertMsg = 'Have you chosen a toolkit yet?';
				}
			}
		};
	}).
	directive('chooseCorpus',function(){
		return {
			restrict:'E',
			templateUrl: 'partials/choose-corpus',
			controller: function($scope,$http,choosedCorpus){
				$scope.guide =false;
				$scope.delMsg='';
				$http({
	      			method: 'GET',
	      			url: '/getcorpus'
	    		}).
        		success(function(data, status, headers, config) {
					//list corpus
					$scope.corpuses = data;
					//selected corpus
					$scope.selection = [];
        		}).
        		error(function(data, status, headers, config) {
	      			console.log('Error!');
	    		});
				//clear selected corpus list
	    		$scope.clearList = function(){
					for (var i=0;i<$scope.selection.length;i++){
						$scope.selection.pop();
					}
				};
				//method to get selected corpus
				$scope.chooseCorpusAction = function(corpus){
					$scope.delMsg = '\''+corpus+'\' corpus was selected';
					$scope.selection.push(corpus);
					choosedCorpus.setCorpusName(corpus);
				};
				//delete corpus
				$scope.delCorpus = function(){
					$scope.delMsg='';
					var corpusCible = $scope.selection.pop();
					$http({
	      				method: 'GET',
	      				url: '/delcorpus/'+corpusCible
		    		}).
	        		success(function(data, status, headers, config) {
	        			$scope.delMsg='\''+corpusCible+'\' was deleted';
	        			$http({
			      			method: 'GET',
			      			url: '/getcorpus'
			    		}).
		        		success(function(data, status, headers, config) {
							//list corpus
							$scope.corpuses = data;
							//selected corpus
							$scope.selection = [];
		        		}).
		        		error(function(data, status, headers, config) {
			      			console.log('Error!');
		    			});
	        		}).
	        		error(function(data, status, headers, config) {
		      			console.log('Error!');
		    		});
				}
			}
		}
	}).
	directive('transcribeCorpus',function(){
		return {
			restrict:'E',
			templateUrl: 'partials/transcribe-corpus',
			controller: function($scope,$http,toolSelectedFactory,choosedCorpus, mySocket, dataResult, seriesDraw){
				$scope.showIcon = false;
				$scope.errorMsg;
				$scope.average;
				var transcribeButton = document.getElementById('transcribe-button');
				var result = document.getElementById('res');
				var werSum;
				var numAudio;
				var recallSum;
				var timeSum;
				//take result if it's sent by socket (for kaldi case)
				mySocket.on('send msg',function(data){	
					mySocket.connect('http://' + location.hostname + ':8080/',{'forceNew':true });
					console.log('recoie un message from server');
					numAudio += 1;
					var br = document.createElement("br");
					var info = document.createTextNode(toolSelectedFactory.getSelectedTool()[0]+' - Audio '+numAudio+' - WER: '+data.WER+', Recall: '+data.recall);
					result.appendChild(info);
					result.appendChild(br);
					werSum += parseFloat(data.WER);
					recallSum += parseFloat(data.recall);	
					timeSum += parseFloat(data.timeExec);
					
				});	
				mySocket.on('send last msg', function(data){
					console.log('recoie dernier message from server');
					numAudio += 1;
					var info = document.createTextNode(toolSelectedFactory.getSelectedTool()[0]+' - Audio '+numAudio+' - WER: '+data.WER+', Recall: '+data.recall);
					var br = document.createElement("br");
					result.appendChild(info);
					werSum += parseFloat(data.WER);
					recallSum += parseFloat(data.recall);
					timeSum += parseFloat(data.timeExec);
					console.log(timeSum);
					//average
					var averageWer = werSum/parseFloat(numAudio);
					var averageRecall = recallSum/parseFloat(numAudio);
					dataResult.setValue(averageWer.toFixed(3)*100,
										averageRecall.toFixed(3)*100,timeSum.toFixed(1));
					$scope.showIcon = false;
					toolSelectedFactory.rmSelectedTool(toolSelectedFactory.getSelectedTool()[0]);
					console.log(toolSelectedFactory.getSelectedTool()[0] + 'length = '+toolSelectedFactory.getSelectedTool().length);
					if (toolSelectedFactory.getSelectedTool().length !== 0){
						result.appendChild(br);
						$scope.requestAction();
					} else {
						transcribeButton.removeAttribute("disabled");
					}
				});

				mySocket.on('error', function(data){
					$scope.showIcon = false;
					transcribeButton.removeAttribute("disabled");
					$scope.errorMsg = data.toString();
				});
				//clear res
				$scope.clearRes=function(){
					document.getElementById('res').innerHTML="";
					dataResult.clear(seriesDraw.getSeries().length);
				}
				
				//function when click transcribe button
				$scope.requestAction = function(){
					werSum = 0;
					numAudio = 0;
					recallSum = 0;
					timeSum = 0;
					switch ((toolSelectedFactory.getSelectedTool()).length){
					 	case 0:
					 		$scope.errorMsg="Have you choosen a tool yet?";
					 		break;
					 	default:
					    	var tool = toolSelectedFactory.getSelectedTool()[0];
					 		//if the toolkit is sphinx-4, disconnect the socket
							gestionSocket(tool);
							//verify if error cases
							if (choosedCorpus.getCorpusName() === "unknown"){
								$scope.errorMsg="Have you choosen a corpus yet?";
							}
							else {
								//disable the transcribe button to make sure client can not click it twice
								transcribeButton.setAttribute("disabled", true);				
								$scope.errorMsg="";
								$scope.showIcon = true;
								$http({
					      			method: 'GET',
					      			url: '/transcribecorpus/'+tool+'/'+choosedCorpus.getCorpusName(),
					    		}).
			            		success(function(data, status, headers, config) {
			            			//request sent
			            			console.log('transcribe corpus request sent');
			            			//affichage de result
			            			mySocket.connect('http://' + location.hostname + ':8080/',{'forceNew':true });
			            		}).
			            		error(function(data, status, headers, config) {
			            			$scope.showIcon = false;
			            			transcribeButton.removeAttribute("disabled");
			            			console.log('transcribe corpus request error');
					    		});
					    	}
					    	break;
					};
				};
				function gestionSocket(tool){
					if (tool === "Sphinx-4"){
						mySocket.disconnect();
					}
					//if the toolkit is kal, connect the socket
					else if (tool === "Kaldi"){
						mySocket.connect('http://' + location.hostname + ':8080/',{'forceNew':true });
					}
				}
			}
		}
	}).
	directive('createCorpus',function(){
		return {
			restrict:'E',
			templateUrl: 'partials/create-corpus',
			controller: function($scope,$http,Upload,corpusName){
				$scope.next = false;

				$scope.uploadAudios = function(files){
					files.forEach(function(file){
						Upload.upload({
				            url: 'uploadfiles/audiofiles/'+corpusName.getName(),
				            method: 'POST',
				            file: file
			        	});
					})
					console.log(corpusName.getName());
					$scope.uploadAudioMsg = "Audios uploaded"
				}
				$scope.uploadTexts = function(files){
					files.forEach(function(file){
						Upload.upload({
				            url: 'uploadfiles/textfiles/'+corpusName.getName(),
				            method: 'POST',
				            file: file
			        	});
					})
					$scope.uploadTextMsg = "Texts uploaded"
				}
				$scope.uploadKeywords = function(files){
					files.forEach(function(file){
						Upload.upload({
				            url: 'uploadfiles/keywordsfiles/'+corpusName.getName(),
				            method: 'POST',
				            file: file
			        	});
					})
					$scope.uploadKeywordsMsg = "Keywords uploaded";
				}
				$scope.clearZone = function(){
					$scope.next = false;
					$scope.text = '';
					$scope.msg = '';
				}
				$scope.submit = function() {
					$scope.doneMsg = "";
					corpusName.setName($scope.text);
					console.log(corpusName.getName());	
					$http({
		      			method: 'GET',
		      			url: '/createcorpus/'+corpusName.getName(),
		    		}).
            		success(function(data, status, headers, config) {
            			$scope.msg = "Corpus name valid";
            			$scope.next = true;
            		}).
            		error(function(data, status, headers, config) {
            			$scope.msg = 'Error create corpus. Your corpus name is used. Choose another one';
		    		});
				}
				$scope.done = function(){
					$http({
		      			method: 'GET',
		      			url: '/addcontent/'+corpusName.getName(),
		    		}).
            		success(function(data, status, headers, config) {
            			$scope.doneMsg = "Creating corpus successfully";
            			$scope.uploadAudioMsg = '';
            			$scope.uploadTextMsg = '';
            			$scope.uploadKeywordsMsg = '';
            			$scope.msg = '';
            			$scope.text = '';
            			$http({
			      			method: 'GET',
			      			url: '/getcorpus'
			    		}).
		        		success(function(data, status, headers, config) {
							//list corpus
							$scope.corpuses = data;
							//selected corpus
							$scope.selection = [];
		        		}).
		        		error(function(data, status, headers, config) {
			      			console.log('Error!');
		    			});
            		}).
            		error(function(data, status, headers, config) {
            			$scope.msg = 'Error create corpus';
		    		});
				}
			}
		}
	}).
	directive('drawChart',function(){
		return {
			restrict:'E',
			templateUrl: 'partials/draw-chart',
			controller: function($scope,dataResult,toolSelectedFactory,seriesDraw){
				$scope.showDiag = false;
				$scope.msgDiag = "Transcribing a corpus before drawing its diagram";
				$scope.labels = ['WER', 'Recall'];
				$scope.labelsTime = ['Time Exec'];
				$scope.colors = 
					[{ // Blue
						fillColor: '#006699',
						strokeColor: '#006699',
						pointColor: '#006699',
						pointStrokeColor: '#fff',
						pointHighlightFill: '#fff',
						pointHighlightStroke: '#006699'
					},
					{ // Red
						fillColor: '#CC3333',
						strokeColor: '#CC3333',
						pointColor: '#CC3333',
						pointStrokeColor: '#fff',
						pointHighlightFill: '#fff',
						pointHighlightStroke: '#CC3333'
					},
					{ // Black
						fillColor: 'Black',
						strokeColor: 'Black',
						pointColor: 'Black',
						pointStrokeColor: '#fff',
						pointHighlightFill: '#fff',
						pointHighlightStroke: 'Black'
					}];

				var chartInstancesTime, chartInstancesWer;
				$scope.$on("create", function (event, chart) {
					var canvas = chart.chart.canvas.id;
				  	if (canvas==="wr"){
				  		if(chartInstancesWer!==undefined){
					  		chartInstancesWer.destroy();
					  		chartInstancesWer = chart;
					  	} else {
					  		chartInstancesWer = chart;
					  	}
					}
				  	if (canvas==="time"){
				  		if(chartInstancesTime!==undefined){
					  		chartInstancesTime.destroy();
					  		chartInstancesTime = chart;
					  	} else{
					  		chartInstancesTime = chart;
					  	} 
				  	} 		
				});

				$scope.draw =function(){
					if ($scope.series !== seriesDraw.getSeries())
						$scope.series = seriesDraw.getSeries();
					var data = dataResult.getValue();
					console.log($scope.series);
					if (!checkData(data)){
						$scope.msgDiag = "Transcribing a corpus before drawing its diagram";
						$scope.showDiag = false;
					}else{
						applyData(data);
					}

					function checkData(data){
						var check = true;
						for(var i=0;i<$scope.series.length;i++){
							if(!data[i].stat){
								check = false;
								break;
							}
						}
						return check;
					}
					function applyData(data){
						$scope.dataWR=[];
						$scope.dataTime=[];
						for(var i=0;i<$scope.series.length;i++){
							var values = data[i].value;
							$scope.msgDiag = "";
							$scope.showDiag = true;
							$scope.dataWR.push([values[0].toFixed(1), values[1].toFixed(1)]);
							$scope.dataTime.push([values[2]]);
						}
					}
				}			
			}
		}
	})





















