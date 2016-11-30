function bindColor(){
  $('#color01').bind(click, function(e){
    gColor = 0;
  });
  $('#color02').bind(click, function(e){
    gColor = 1;
  });
  $('#color03').bind(click, function(e){
    gColor = 2;
  });
  $('#color04').bind(click, function(e){
    gColor = 3;
  });
  $('#color05').bind(click, function(e){
    gColor = 4;
  });
  $('#color06').bind(click, function(e){
    gColor = 5;
  });
  $('#color07').bind(click, function(e){
    gColor = 6;
  });
}

function bindDownload(){
  $('#downloadButton').bind(click, function(e) {
    html2canvas($("#canvas"), {
        onrendered: function(canvas) {         
            var imgData = canvas.toDataURL(
                'image/jpeg');              
            var doc = new jsPDF('p', 'mm', [700, 1000]);
            doc.addImage(imgData, 'JPEG', 0, 0);
            doc.save('witBoardExport.pdf');
        }
    });
  }); 
}

function bindHideComment(){
  $('#hideTextArea').bind(click, function(e){

    if (textareahidden == false){
      textareahidden = true;
      document.getElementById('hideTextArea').value = "Show comments";
    }
    else {
      textareahidden = false;
      document.getElementById('hideTextArea').value = "Hide comments";
    }

    var commentsList = document.getElementsByClassName("info");
    for( var index in commentsList ){
        commentsList[index].hidden=textareahidden;
    }
  });
}

function bindNewBoard(){
  $('#newBoardButton').bind(click, function(e) {
    // TODO redirect to new board.
    socket.emit('new board');
  });
}

function bindCloneBoard(){
  $('#cloneButton').bind(click, function(e) {
    // TODO redirect to new board.
    socket.emit('clone board');
  });
}

function bindShareBoard(){
  $('#shareButton').bind(click, function(e) {
    window.prompt("Share this url!", window.location.href);
  })
}

function bindAddComment(){
  $('#addCommentButton').bind(click, function(e) {
    addCommentMode = !addCommentMode;
    rerenderButtonStates();
  });
}

function bindCanvasDraw(){
  $('#canvas').bind(mouseDown, function(e){
    // comment part
    if(addCommentMode){
      addCommentMode = false;
      rerenderButtonStates();

      newTempComment = {};
      newTempComment.authorClientId = gClientId;
      newTempComment.message = "";
      newTempComment.xPos = e.pageX;
      newTempComment.yPos = e.pageY;

      rerenderComments();
      return;
    }
    // prevent interrupted by comments
    $('.info').css('pointer-events', 'none');

    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;
      
    paint = true;

    var strokeId = nextStrokeId;
    nextStrokeId++;
    addStrokeIfNotExist(gClientId, strokeId);

    // update stroke properties
    var strokeData = strokeMap[gClientId][strokeId];
    strokeData.colorId = gColor;
    strokeData.isEraserStroke = false; // TODO allow eraser mode?
    socket.emit('set stroke properties', strokeId, gColor, false);

    // draw the point
    var data_point = addDrawnPoint(gClientId, strokeId, mouseX, mouseY);
    redraw();
    
    socket.emit("draw point", strokeId, data_point);

    // counter += 1;
  });

  $('#canvas').bind(mouseMove, function(e){
    if(paint){
      var mouseX = e.pageX - this.offsetLeft;
      var mouseY = e.pageY - this.offsetTop;

      var strokeId = nextStrokeId - 1;
      var data_point = addDrawnPoint(gClientId, strokeId, mouseX, mouseY);
      redraw();
    
      socket.emit("draw point", strokeId, data_point);
      // counter += 1;
    }
  });

  $('#canvas').bind(mouseUp, function(e){
    $('.info').css('pointer-events', 'auto');
    paint = false;
  });

  $('#canvas').bind(mouseLeave, function(e){
    $('.info').css('pointer-events', 'auto');
    paint = false;
  });
}

function bindCanvasHighlight(){
  $('#canvas').bind(mouseUp, function(e){
    if(ableFade){
      var mouseX = e.pageX;
      var mouseY = e.pageY;
      socket.emit('highlight', mouseX, mouseY, gClientId);
      showHighlight(mouseX, mouseY, gClientId);
    }
  });
}

function bindClientButton(){
  $(document).on(click, '.client', function(e){
    var buttonsClientId = $(this).attr('data-value');
    if (buttonsClientId != lastShowClient) {
      redraw(buttonsClientId);
      return;
    }
    // clear filtering if filter was already on
    redraw();
  });
}

function bindSetPassword(){
  $(document).on(click, 'button#setPassword', function(e){
    socket.emit('set-password', $('#password-area').val());
  });
}
