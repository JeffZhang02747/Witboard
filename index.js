var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


var database = require("./db");

database.insertBoardData("40", {"dsfsfd":"fuck you"});
console.log( database.getBoardData("40") );



// db code
// var admin = require("firebase-admin");
// var keyLoc = "witboardKey.json";

// admin.initializeApp({
//     credential: admin.credential.cert(keyLoc),
//     databaseURL: "https://witboard-6b200.firebaseio.com"
// });

// var db = admin.database();
// var ref = db.ref("server/saving-data/fireblog");


// var usersRef = ref.child("counter");
// // usersRef.set({
// //     "wwwswss": "daadsc"
// // });


// usersRef.once("value", function(data) {
//     console.log( data.val() );

//     // do some stuff once
// });




// db code end




app.get('/', function(req, res){
    res.sendfile('index.html');
});

app.get(new RegExp('/[0-9]+'), function(req, res){
    res.sendfile('index.html');
});




app.use(express.static(__dirname + '/public'));
app.use('/node_modules',  express.static(__dirname + '/node_modules'));

var nextBoardId = 1;

io.on('connection', function(socket){
    socket.on("draw point", function(data_point, counter){

        socket.broadcast.emit('draw point', data_point, counter);
    });

    socket.on('new board', function() {
        var newBoardId = nextBoardId;
        var boardNameSpace = io.of('/' + newBoardId);
        boardNameSpace.on('connection', function(socket){
        });
        // boardNameSpace.emit('hi', 'everyone!');
        nextBoardId++;

        var newNamespace = io.of('/' + newBoardId);
        newNamespace.on('connection', function(socket){


            // TODO below is a copy of above code.. refactor it!
            socket.on("draw point", function(data_point, counter){


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