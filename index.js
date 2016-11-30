var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);            // the default namespace
var BoardCollection = require('./BoardCollection.js');


app.get('/', function(req, res){
    res.sendfile('index.html');
});

app.get(new RegExp('/[0-9]+'), function(req, res){
    res.sendfile('index.html');
});

app.use(express.static(__dirname + '/public'));
app.use('/node_modules',  express.static(__dirname + '/node_modules'));


global.collection = new BoardCollection.BoardCollection(io);

var port = process.env.PORT || 5000;

http.listen(port, function(){
	console.log('listening on *:5000');
});