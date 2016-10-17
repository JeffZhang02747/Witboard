var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


// var id_to_nickname = [];//keep track of client id to their nickname

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
    socket.on("draw point", function(data_point, counter){
        console.log("counter " + counter);

        socket.broadcast.emit('draw point', data_point, counter);
    });

    socket.on('new board', function() {
        var newBoardId = nextBoardId;
        var boardNameSpace = io.of('/' + newBoardId);
        boardNameSpace.on('connection', function(socket){
            console.log('someone connected on board ' + newBoardId);
        });
        // boardNameSpace.emit('hi', 'everyone!');
        nextBoardId++;

        var newNamespace = io.of('/' + newBoardId);
        newNamespace.on('connection', function(socket){
            console.log('someone connected on board ' + newBoardId);

            // TODO below is a copy of above code.. refactor it!
            socket.on("draw point", function(data_point, counter){
                console.log("counter " + counter);

                socket.broadcast.emit('draw point', data_point, counter);
            });
        });
        socket.emit('board created', newBoardId);
    });
});

var port = process.env.PORT || 5000;

http.listen(port, function(){
  console.log('listening on *:5000');
});