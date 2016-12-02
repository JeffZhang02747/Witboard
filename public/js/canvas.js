$(document).ready(function(){
  currBoardId = getCurrBoardId();
  if (currBoardId) {
    socket = io('/' + currBoardId);
  } else {
    socket = io.connect(window.location.hostname);
  }

  context = document.getElementById('canvas').getContext("2d");
  // Default styling
  context.strokeStyle = "#df4b26";
  context.lineJoin = "round";
  context.lineWidth = 5;

  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    mouseDown = 'touchstart';
    mouseMove = 'touchmove';
    mouseUp = 'touchend';
    mouseLeave = 'touchend';
    click = 'touchend';
    $('body').bind('touchmove', function(e){e.preventDefault()})
  }

  listenerBinding();

  canvasReact();

  socket.on("highlight", function(x, y, clientId){
    showHighlight(x, y, clientId)
  });

  socket.on("new comment", function(commentId, comment){
    comments[commentId] = comment;
    rerenderComments();

  });

  socket.on("updated comment", function(commentId, comment) {
    var oldMsg = comments[commentId].message;
    var newMsg = comment.message;
    comments[commentId] = comment;

    if (oldMsg != newMsg) {
      rerenderComments();
    } else {
      var xPos = comment.xPos;
      var yPos = comment.yPos;
      if ( document.getElementById(commentId) != null) {
        document.getElementById(commentId).style.left = xPos + 'px';
        document.getElementById(commentId).style.top = yPos + 'px';
      }
    }
  });


  socket.on("deleted comment", function(commentId) {
    comments[commentId] = undefined;
    rerenderComments();
  });

  socket.on('ordered stroke array updated', function(inputOrderedStrokeIds) {
    orderedStrokeIds = inputOrderedStrokeIds;
  });

  socket.on("stroke properties updated", function(clientId, authorStrokeId, colorId, isEraserStroke) {
    addStrokeIfNotExist(clientId, authorStrokeId);

    var strokeData = strokeMap[clientId][authorStrokeId];
    strokeData.colorId = colorId;
    strokeData.isEraserStroke = isEraserStroke;
  });

  socket.on("draw point", function(authorClientId, authorStrokeId, data_point) {
    addStrokeIfNotExist(authorClientId, authorStrokeId);

    addDrawnPoint(authorClientId, authorStrokeId, data_point.location_x, data_point.location_y);
    redraw();
  })


  socket.on("initialize", function(clientId, inputOrderedStrokeIds, inputStrokeMap, allowChangePassword, passedComments){

    $('#password-modal').modal('hide');
    comments = passedComments;
    rerenderComments();

    orderedStrokeIds = inputOrderedStrokeIds;
    strokeMap = inputStrokeMap;

    gClientId = clientId;
    var client_color = "white";
    $('.mainSection .avatar-section').append("<label class='client' style='color: yellow;' data-value='-1'>DEF</label>");

    if( allowChangePassword ){
      $('#passwordArea').css('display', 'inline');
    }

    redraw();

  });

  socket.on('board created', function(newBoardId) {
    // socket = io(window.location.hostname + newBoardId);
    // debugger;

      var newPath = "/" + newBoardId;
      window.location.pathname = newPath;
  });

  socket.on('active user list updated', function(clientIds){
    $('label.client').remove();
    var client_color = "white";
    clientIds.forEach(function(clientId) {
      if(gClientId == clientId){
        client_color = "red";
      }
      else{
        client_color = "white";
      }
      $('.mainSection .avatar-section').after("<label class='client' style='color: " + client_color + ";' data-value='" + clientId + "'>" + clientId + "</label>");
    });
  });


  socket.on('password required', function() {
    passwordRequired = true;
    $("#alert-wrong").hide();
    passwordInit();
  });

  socket.on('incorrect password', function() {
    passwordRequired = true;
    $("#alert-wrong").show();
    passwordInit();
  });

  socket.on('password change successful',function() {
    $("#witboard-title").after('<div class="alert alert-success alert-dismissible"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>Password Changed!</div>');
  });

  socket.on('invalid-password', function(msg){
    $("#witboard-title").after('<div class="alert alert-danger alert-dismissible"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + msg + '</div>');
  });

}); // document.ready
