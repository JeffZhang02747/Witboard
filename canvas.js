
    var socket = io.connect(window.location.hostname);
    var typed = false;
    var timeout = undefined;


    socket.emit("draw point", data_point);

    socket.on("draw point", function(data_point){
      #draw the point here
    })
