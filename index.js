var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


var id_to_nickname = [];//keep track of client id to their nickname

app.get('/', function(req, res){
  res.sendfile('index.html');
});

app.use(express.static(__dirname + '/public'));
app.use('/node_modules',  express.static(__dirname + '/node_modules'));


io.on('connection', function(socket){

  socket.on('chat message', function(msg){
  	var user = "";

  	for( var i = 0 ; i < id_to_nickname.length ; i++){
  		if(id_to_nickname[i].id == socket.id){
  			user = id_to_nickname[i].name;
  		}
  	}
    socket.broadcast.emit('chat message', {"user": user , "text":msg});
  });


  socket.on('disconnect', function(){
  	//delete the key update the dict

  	var delete_index = 0;
  	var delete_name = '';
  	for(var i=0 ; i < id_to_nickname.length ; i++){
  		if(id_to_nickname[i].id == socket.id){
  			delete_index = i;
  			delete_name = id_to_nickname[i].name;
  			break;
  		}
  	}

  	id_to_nickname.splice( delete_index , 1);
  	io.emit("update nickname", id_to_nickname);

  	socket.broadcast.emit("user leaved" , delete_name);
  });


  socket.on('add nickname', function(name){
  	//update key , update the dict
  	id_to_nickname.push({"id": socket.id , "name": name , "typing": false });

  	io.emit("update nickname", id_to_nickname);
  	socket.broadcast.emit("user joined", name);
  });

  socket.on('typing', function(typed){

  	for( var i = 0 ; i < id_to_nickname.length; i ++){
  		if(id_to_nickname[i].id == socket.id){
  			id_to_nickname[i].typing = typed;
  			break;
  		}
  	}

  	socket.broadcast.emit("update nickname", id_to_nickname)
  });

});


var port = process.env.PORT || 5000;



http.listen(port, function(){
  console.log('listening on *:5000');
});