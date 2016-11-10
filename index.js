var BoardDirector = require('./BoardDirector.js');

var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);            // the default namespace


// var id_to_nickname = [];//keep track of client id to their nickname

// map of board Id's to available boardDirectors
// TODO do we even need this around?
// TODO determine what to do with inactive boards or persisted boards (boards that
// somehow don't have a corresponding BoardDirector instance at the moment?)
boardDirectorMap = new Map();

app.get('/', function(req, res){
    res.sendfile('index.html');
});

app.get(new RegExp('/[0-9]+'), function(req, res){
    console.log('i handlez!');
    res.sendfile('index.html');
});

app.use(express.static(__dirname + '/public'));
app.use('/node_modules',  express.static(__dirname + '/node_modules'));

var nextBoardId = 1;

io.on('connection', function(socket){
    // the handler defined below is only for the main page.
    // see board
    socket.on("draw point", function(data_point, counter){
        console.log("counter " + counter);

        socket.broadcast.emit('draw point', data_point, counter);
    });

    socket.on('new board', function() {
        var newBoardId = nextBoardId;
        nextBoardId++;
        var boardNameSpace = io.of('/' + newBoardId);
        boardDirectorMap[newBoardId] = new BoardDirector.BoardDirector(newBoardId, boardNameSpace);
        
        socket.emit('board created', newBoardId);
    });
});

var port = process.env.PORT || 5000;

http.listen(port, function(){
  console.log('listening on *:5000');
});