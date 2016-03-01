"use strict";

var io;

exports.init = function(server){
	io = require('socket.io').listen(server);
	io.on('connect', function(){
		console.log('a user connected');
	});
};

exports.getSocket = function(){
	//console.log(io);
	return io;
};