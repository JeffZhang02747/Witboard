$(document).ready(function(){
  var currBoardId = getCurrBoardId(); // TODO do something with this!
  var socket;
  if (currBoardId) {
    socket = io('/' + currBoardId);
  } else {
    socket = io.connect(window.location.hostname);
  }
  var mycomments = {}; // TODO get rid of this?
  // a new comment object which isn't assigned an commentId yet.


  var newTempComment = undefined; // undefined means there's no newTempComment


  var comments = new Array();
  // array of textarea objects;
  // this array is kept in sync with comments
  var addCommentMode = false;
  var textarea = null;
  var textareaindex = 0;  // TODO delete this var? don't think we're using it anymore?
  var textareahidden = false;
  var counter = 0;
  var gClientId = -1;
  var passwordRequired = false;
  var highlightMode = false;
  var ableFade = true;

  context = document.getElementById('canvas').getContext("2d");
  // Default styling
  context.strokeStyle = "#df4b26";
  context.lineJoin = "round";
  context.lineWidth = 5;

  var points = {};
  var gColor = 0;
  var nextStrokeId = 0;   // corresponds to authorStrokeId; stroke id unique to this client
  var paint;
  var r_points = {};
  var gColorList = ["gold", "darkorange", "navy", "yellowgreen", "firebrick", "powderblue", "white"];

  // drawing model (all the data you need to render the lines)
  var orderedStrokeIds = new Array(); // see BoardDirector's member var
  var strokeMap = {}; // see BoardDirector's member var

  // Event types
  var mouseDown = 'mousedown',
  mouseMove = 'mousemove',
  mouseUp = 'mouseup',
  mouseLeave = 'mouseleave',
  click = 'click';
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    mouseDown = 'touchstart';
    mouseMove = 'touchmove';
    mouseUp = 'touchend';
    mouseLeave = 'touchend';
    click = 'touchend';
    // $('html, body').on('touchstart touchmove', function(e){ 
    //      e.preventDefault(); 
    // });
  }

  // returns the current board id if it exists, returns null otherwise
  function getCurrBoardId() {
    var re = new RegExp("/([0-9a-zA-Z\-]+)$");
    var regexMatches = re.exec(window.location.href);
    if (!regexMatches || !(regexMatches[1])) {
      return null; 
    }
    return regexMatches[1];
  }

  function rerenderButtonStates() {
    if (addCommentMode && highlightMode) {
      alert("WARNING! addCommentMode && highlightMode are both true!!");
    }

    // settings for add comment button
    if(addCommentMode){
      $('#addCommentButton').css('color', 'red');
      $("#addCommentButton").css("pointer-events", "auto");
    } else if(!highlightMode) {
      $('#addCommentButton').css('color', 'white');
      $("#addCommentButton").css("pointer-events", "auto");
    } else {
      $('#addCommentButton').css('color', 'grey');
      $("#addCommentButton").css("pointer-events", "none"); 
    }

    // settings for highlight button
    if(highlightMode){
      $('#highlightButton').css('color', 'red');
      $("#highlightButton").css("pointer-events", "auto");
    } else if(!addCommentMode) {
      $('#highlightButton').css('color', 'white');
      $("#highlightButton").css("pointer-events", "auto");
    } else {
      $('#highlightButton').css('color', 'grey');
      $("#highlightButton").css("pointer-events", "none"); 
    }
  }

  // pre-condition: stroke must have been created
  // adds drawn point (from self or other clients) to model data; returns dataPoint for convenience
  function addDrawnPoint(authorClientId, authorStrokeId, x, y) {
    var dataPoint = {};
    dataPoint.location_x = x;
    dataPoint.location_y = y;
    strokeMap[authorClientId][authorStrokeId].dataPoints.push(dataPoint);
    return dataPoint;
  }


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

  $('#newBoardButton').bind(click, function(e) {
    // TODO redirect to new board.
    socket.emit('new board');
  });


  $('#cloneButton').bind(click, function(e) {
    // TODO redirect to new board.
    socket.emit('clone board');
  });

  $('#shareButton').bind(click, function(e) {
    window.prompt("Share this url!", window.location.href);
  })


  $('#addCommentButton').bind(click, function(e) {
    addCommentMode = !addCommentMode;
    rerenderButtonStates();
  });


  canvasReact();

  function canvasReact(){
    $('#canvas').off(mouseDown);
    $('#canvas').off(mouseUp);
    $('#canvas').off(mouseMove);
    $('#canvas').off(mouseLeave);
    $('#canvas').off(click);

    if(!highlightMode){
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
        paint = false;
      });

      $('#canvas').bind(mouseLeave, function(e){
        paint = false;
      });
    }
    else{
      $('#canvas').bind(mouseUp, function(e){
        if(ableFade){
          var mouseX = e.pageX;
          var mouseY = e.pageY;
          socket.emit('highlight', mouseX, mouseY, gClientId);
          showHighlight(mouseX, mouseY, gClientId);
        }
      });
    }
  }
  // end canvas react function
  function showHighlight(x, y, clientId){
    ableFade = false;
    $('a.popFade').css('top', y);
    $('a.popFade').css('left', x);
    $('a.popFade').text(clientId);
    $('a.popFade').fadeIn('fast').delay(1000).fadeOut('fast', function(){ableFade = true; });
  }

  socket.on("highlight", function(x, y, clientId){
    showHighlight(x, y, clientId)
  });

  $('#highlightButton').bind(click, function(e){
    highlightMode = !highlightMode;
    rerenderButtonStates();
    canvasReact();
  });

  function passwordInit(){
    if(passwordRequired){
      $('#password-modal').modal({
        keyboard: false,
        backdrop: 'static'
      });
    }
  }

  $(document).on(click, '#verify-submit', function(e){
    socket.emit('verify with password', $('#password-input').val());
  });

  function redraw(showClient = -1){
    context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
    
    for (var i = 0; i < orderedStrokeIds.length; i++) {
      var strokeId = orderedStrokeIds[i];
      if (showClient != -1 && showClient != strokeId.authorClientId) {
        continue;
      }

      console.log(strokeId.authorClientId);

      if (strokeMap[strokeId.authorClientId] == null) {
        // no idea what's going on but this could be null
        continue;
      }

      var strokeData = strokeMap[strokeId.authorClientId][strokeId.authorStrokeId];
      var dataPoints = strokeData.dataPoints;

      if (dataPoints == null) {
        // no idea what's going on but this could be null
        continue;
      }

      // sometimes we are told about the stroke before we get data about it
      if (dataPoints.length < 1) {
        continue;
      }

      context.strokeStyle = gColorList[strokeData.colorId];

      context.beginPath();
      // draw a tiny line to show the first dot
      context.moveTo(dataPoints[0].location_x - 1, dataPoints[0].location_y);
      context.lineTo(dataPoints[0].location_x, dataPoints[0].location_y);

      for (var j = 1; j < dataPoints.length; j++) {
        context.moveTo(dataPoints[j-1].location_x, dataPoints[j-1].location_y);
        context.lineTo(dataPoints[j].location_x, dataPoints[j].location_y);
      }
      context.closePath();
      context.stroke();
    }

  }

  function rerenderComments() {

    if(textareahidden){ return; }

    console.log( comments );

    $('.info').remove();

    function addTextArea(commentId, comment) {
      if (!comment) {
        return;
      }

      var division = document.createElement('div'); 
      division.className = 'info';
      division.style = "width:150px; height:150px;";
      division.id = commentId;

      var label = document.createElement('label');
      label.className = 'textareaLabel';
      if (comment.authorClientId == gClientId){
        label.innerHTML = "You";
        label.style.color = 'blue';
      }
      else{
        var userName = "User#" + String(comment.authorClientId);
        label.innerHTML = userName;
        label.style.color = 'red';
      }
      
      var userComments = document.createElement('textarea');
      userComments.name = 'textarea' + textareaindex;
      userComments.className = 'userComment';
      userComments.id = "commentId" + commentId;

      division.addEventListener(mouseDown, function mouseDownOnTextarea(e) {
          if (comment.authorClientId != gClientId) {return};

          var x = this.offsetLeft - e.pageX,
              y = this.offsetTop - e.pageY;
          function drag(e) {
              this.style.left = e.pageX + x + 'px';
              this.style.top = e.pageY + y + 'px';
              comment.value = this.children[1].value;
              comment.xPos = parseInt(division.style.left);
              comment.yPos = parseInt(division.style.top);
              socket.emit("edit comment", this.id, this.children[1].value, parseInt(this.style.left), parseInt(this.style.top) );
          }
          function stopDrag() {
              this.removeEventListener(mouseMove, drag);
              this.removeEventListener(mouseUp, stopDrag);
          }
          this.addEventListener(mouseMove, drag);
          this.addEventListener(mouseUp, stopDrag);
      });
      division.addEventListener('dblclick', function remove(){
        if (comment.authorClientId != gClientId) {return};
        comments[commentId] = undefined;
        this.remove();
        socket.emit('delete comment', division.id);
      });


      userComments.value = comment.message;
      division.style.top = comment.yPos + 'px';
      division.style.left = comment.xPos + 'px';
      document.body.appendChild(division);
      document.getElementById(commentId).appendChild(label);
      document.getElementById(commentId).appendChild(userComments);

      var commited = false;
      $('#' + "commentId" + commentId).emojioneArea({
        pickerPosition: "left",
        tonesStyle: "bullet",
        events: {
          blur: function (editor, event) {
            if (comment.authorClientId != gClientId) {
              this.setText(comment.message);
              return};
            if (userComments.value != "") {
              comment.message = userComments.value;
              comment.xPos = parseInt(division.style.left);
              comment.yPos = parseInt(division.style.top);
              if (commentId == "tempId" && !commited) {
                commited = true;

                socket.emit("add comment", userComments.value, parseInt(division.style.left), parseInt(division.style.top) );
                socket.on("id for new comment", function(commentId) {
                   division.id = commentId;
                   comments[commentId] = comment;
                   newTempComment = undefined;
                });
              } else {
                  socket.emit("edit comment", division.id, userComments.value, parseInt(division.style.left), parseInt(
                  division.style.top));
              }
            }
          }
        }
      });
    }

    // $.each(comments, addTextArea);

    for ( var index in comments ) {

      if ( comments[index] != undefined){
        addTextArea(index, comments[index]);
      }
    }

    if (typeof(newTempComment) !== "undefined") {
      addTextArea("tempId", newTempComment);
    }
  }

  socket.on("new comment", function(commentId, comment){
    console.log("wow this comment");

    comments[commentId] = comment;
    rerenderComments();

  });

  socket.on("updated comment", function(commentId, comment) {
    var oldMsg = comments[commentId].message;
    var newMsg = comment.message;
    comments[commentId] = comment;

    if (oldMsg != newMsg) {
      console.log("rerendedd");
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

  // copied from Stroke.js because frontend code can't access backend js
  var StrokeData = function(colorId = 0, isEraserStroke = false) {
      this.colorId = colorId;
      this.isEraserStroke = isEraserStroke; // if true, represents that the stroke is eraser sized
      this.dataPoints = new Array();  // array where each element represents data about a drawn point
  }

  // also responsible for adding elements to strokeMap if a new authorClientId is encountered
  var addStrokeIfNotExist = function(authorClientId, authorStrokeId) {
    var clientsStrokeArray = strokeMap[authorClientId];
    if (typeof(clientsStrokeArray) === 'undefined') {
      strokeMap[authorClientId] = new Array();
      clientsStrokeArray = strokeMap[authorClientId];
    }

    if (typeof(clientsStrokeArray[authorStrokeId]) === 'undefined') {
      clientsStrokeArray[authorStrokeId] = new StrokeData();
    }
  }

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

  $(document).on(click, '.client', function(e){
    redraw($(this).attr('data-value'));
  });

  $(document).on(click, 'button#setPassword', function(e){
    socket.emit('set-password', $('#password-area').val());
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
