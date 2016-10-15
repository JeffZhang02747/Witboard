var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


// var id_to_nickname = [];//keep track of client id to their nickname

app.get('/', function(req, res){
    res.sendfile('index.html');
});

app.use(express.static(__dirname + '/public'));
app.use('/node_modules',  express.static(__dirname + '/node_modules'));


io.on('connection', function(socket){
    socket.on("draw point", function(data_point, counter){
        console.log("counter " + counter);

        socket.broadcast.emit('draw point', data_point, counter);
    });
});


var port = process.env.PORT || 5000;

http.listen(port, function(){
  console.log('listening on *:5000');
});