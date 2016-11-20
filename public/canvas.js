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
  var commentTextAreas = new Array();
  var showText = false;
  var textarea = null;
  var textareaindex = 0;  // TODO delete this var? don't think we're using it anymore?
  var textareahidden = false;
  var timeout = undefined;
  var date = new Date();
  var passcode = date.getTime();
  var counter = 0;
  var data_point = {};
  var gClientId = -1;
  var passwordRequired = false;
  var highlight = false;

  context = document.getElementById('canvas').getContext("2d");
  // Default styling
  context.strokeStyle = "#df4b26";
  context.lineJoin = "round";
  context.lineWidth = 5;

  var points = {};
  var gColor = 0;
  var paint;
  var r_points = {};
  var gColorList = ["gold", "darkorange", "navy", "yellowgreen", "firebrick", "powderblue", "white"];

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
    $('html, body').on('touchstart touchmove', function(e){ 
         e.preventDefault(); 
    });
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

  function addClick(clientId, x, y, color, dragging)
  {
    if(!points.hasOwnProperty(clientId)){
      points[clientId] = {};
      points[clientId].clickX = new Array();
      points[clientId].clickY = new Array();
      points[clientId].clickDrag = new Array();
      points[clientId].color = new Array();
    }
    points[clientId].clickX.push(x);
    points[clientId].clickY.push(y);
    points[clientId].clickDrag.push(dragging);
    points[clientId].color.push(color);
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

    var textareaList = document.getElementsByTagName("textarea");
    for(var i=0; i<textareaList.length; i++){
        textareaList[i].hidden = textareahidden;
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


  $('#textBoxButton').bind(click, function(e) {
    if(showText){
      $('#textBoxButton').css('color', 'black');
      $("#highlightButton").css("pointer-events", "auto");
      $("#highlightButton").css('color', 'black');
    }
    else{
      $('#textBoxButton').css('color', 'red');
      $("#highlightButton").css("pointer-events", "none");
      $("#highlightButton").css('color', 'grey');
    }
    showText = !showText;
    
  });


  canvasReact();

  function canvasReact(){
    $('#canvas').off(mouseDown);
    $('#canvas').off(mouseUp);
    $('#canvas').off(mouseMove);
    $('#canvas').off(mouseLeave);
    $('#canvas').off(click);

    if(!highlight){
      $('#canvas').bind(mouseDown, function(e){
        if(showText){
          // var textOnCanvas = document.getElementById('canvas');
          // mycomments[textareaindex] = document.createElement('textarea');
          // mycomments[textareaindex].className = 'info';
          // mycomments[textareaindex].name = 'textarea' + textareaindex;
          // mycomments[textareaindex].id = textareaindex;
          // mycomments[textareaindex].addEventListener('mousedown', function mouseDownOnTextarea(e) {
          //     var x = this.offsetLeft - e.clientX,
          //         y = this.offsetTop - e.clientY;
          //     function drag(e) {
          //         this.style.left = e.clientX + x + 'px';
          //         this.style.top = e.clientY + y + 'px';
          //         values.x = e.clientX + x;
          //         values.y = e.clientY + y;
          //         console.log("wow");
          //         // debugger;
          //         socket.emit('drag comments', gClientId, values, this.id);
          //     }
          //     function stopDrag() {
          //         this.removeEventListener('mousemove', drag);
          //         this.removeEventListener('mouseup', stopDrag);
          //     }
          //     this.addEventListener('mousemove', drag);
          //     this.addEventListener('mouseup', stopDrag);
          // });
          // mycomments[textareaindex].addEventListener('dblclick', function remove(){
          //   socket.emit('delete comments', gClientId, values, this.id);
          //   this.remove();
          // });
          // document.body.appendChild(mycomments[textareaindex]);
          // var values = {};
          // values.x = e.clientX;
          // values.y = e.clientY;

          newTempComment = new Object();
          newTempComment.authorClientId = gClientId;
          newTempComment.message = "";
          newTempComment.xPos = e.clientX;
          newTempComment.yPos = e.clientY;

          rerenderComments();

          socket.on("id for new comment", function(commentId) {
             comments[commentId] = newTempComment;
             newTempComment = undefined;
          });
          socket.emit("add comment", newTempComment.message, newTempComment.xPos, newTempComment.yPos);

          // var x = e.clientX - textOnCanvas.offsetLeft,
          //     y = e.clientY - textOnCanvas.offsetTop;
          // mycomments[textareaindex].value = "x: " + x + " y: " + y;
          // mycomments[textareaindex].style.top = e.clientY + 'px';
          // mycomments[textareaindex].style.left = e.clientX + 'px';
          textareaindex++;    
          return;
        }

        var mouseX = e.pageX - this.offsetLeft;
        var mouseY = e.pageY - this.offsetTop;
          
        paint = true;
        addClick(gClientId, mouseX, mouseY, gColor, false);
        redraw();
        data_point.location_x = mouseX;
        data_point.location_y = mouseY;
        data_point.clientId = gClientId;
        data_point.starting = true;
        data_point.color = gColor;

        counter += 1;
        socket.emit("draw point", data_point, counter);
      });

      $('#canvas').bind(mouseMove, function(e){
        if(paint){
          var mouseX = e.pageX - this.offsetLeft;
          var mouseY = e.pageY - this.offsetTop;
          addClick(gClientId, mouseX, mouseY, gColor, true);
          redraw();
          data_point.location_x = mouseX;
          data_point.location_y = mouseY;
          data_point.clientId = gClientId;
          data_point.starting = false;
          data_point.color = gColor;

          counter += 1;
          socket.emit("draw point", data_point, counter);
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
        var mouseX = e.pageX;
        var mouseY = e.pageY;
        socket.emit('highlight', mouseX, mouseY, gClientId);
        showHighlight(mouseX, mouseY, gClientId);

      });
    }
  }
  // end canvas react function
  function showHighlight(x, y, clientId){
    $('a.popFade').css('top', y);
    $('a.popFade').css('left', x);
    $('a.popFade').text(clientId);
    $('a.popFade').fadeIn('slow').delay(1000).fadeOut('slow');
  }

  socket.on("highlight", function(x, y, clientId){
    showHighlight(x, y, clientId)
  });

  $('#highlightButton').bind(click, function(e){
    if(highlight){
      $('#highlightButton').css('color', 'black');
      $("#textBoxButton").css("pointer-events", "auto");
      $("#textBoxButton").css('color', 'black');
    }
    else{
      $('#highlightButton').css('color', 'red');
      $("#textBoxButton").css("pointer-events", "none");
      $("#textBoxButton").css('color', 'grey');

    }
    highlight = !highlight;
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
    
    $.each(points, function(clientId, thisPoint) {
      for(var i=0; i < thisPoint.clickX.length; i++) {
        if(showClient == clientId || showClient == -1){
          if(thisPoint.clickDrag[i] && i){
            context.moveTo(thisPoint.clickX[i-1], thisPoint.clickY[i-1]);
            context.lineTo(thisPoint.clickX[i], thisPoint.clickY[i]);
            if (i == thisPoint.clickX.length - 1) {
              context.closePath();
              context.stroke();
            }
           }else{
             if (i !== 0) {
               context.closePath();
               context.stroke();
             }
             context.strokeStyle = gColorList[thisPoint.color[i]];
             context.beginPath();
             context.moveTo(thisPoint.clickX[i]-1, thisPoint.clickY[i]);             
           }
           context.lineTo(thisPoint.clickX[i], thisPoint.clickY[i]);
        }
      }
    });
  }

  function rerenderComments() {
    $(document).remove('textarea');
    // for(var i=0; i<comments.length; i++){
      
    //   // TODO does this work?
    //   // document.body.removeChild(userComments);
    // }

    function addTextArea(commentId, comment) {
      if (!comment) {
        return;
      }

      var textOnCanvas = document.getElementById('canvas');
      var userComments = document.createElement('textarea');
      userComments.className = 'info';
      userComments.name = 'textarea' + textareaindex;
      userComments.id = commentId;
      userComments.addEventListener(mouseDown, function mouseDownOnTextarea(e) {
          var x = userComments.offsetLeft - e.clientX,
              y = userComments.offsetTop - e.clientY;
          function drag(e) {
              this.style.left = e.clientX + x + 'px';
              this.style.top = e.clientY + y + 'px';
              var values = {};
              values.x = e.clientX + x;
              values.y = e.clientY + y;
              // debugger;
              // console.log('is this getting called? ', this.id);
              socket.emit('drag comments', gClientId, values, this.id);
          }
          function stopDrag() {
              this.removeEventListener(mouseMove, drag);
              this.removeEventListener(mouseUp, stopDrag);

          }
          this.addEventListener(mouseMove, drag);
          this.addEventListener(mouseUp, stopDrag);
      });
      userComments.addEventListener('dblclick', function remove(){
        socket.emit('delete comments', this.id);
        this.remove();
      });
      document.body.appendChild(userComments);
      // var x = values.x - textOnCanvas.offsetLeft,
      //     y = values.y - textOnCanvas.offsetTop;

      userComments.value = comment.message;
      userComments.style.top = comment.yPos + 'px';
      userComments.style.left = comment.xPos + 'px';
    }

    $.each(comments, addTextArea);
    if (typeof(newTempComment) !== "undefined") {
      addTextArea("tempId", newTempComment);
    }
  }

  socket.on("new comment", function(commentId, comment){
    comments[commentId] = comment;
    rerenderComments();

    // var textOnCanvas = document.getElementById('canvas');
    // var userComments = document.createElement('textarea');
    //   userComments.className = 'info';
    //   userComments.name = 'textarea' + textareaindex;
    //   userComments.id = commentId;
    //   userComments.addEventListener('mousedown', function mouseDownOnTextarea(e) {
    //       var x = userComments.offsetLeft - e.clientX,
    //           y = userComments.offsetTop - e.clientY;
    //       function drag(e) {
    //           this.style.left = e.clientX + x + 'px';
    //           this.style.top = e.clientY + y + 'px';
    //           values.x = e.clientX + x;
    //           values.y = e.clientY + y;
    //           // debugger;
    //           // console.log('is this getting called? ', this.id);
    //           socket.emit('drag comments', gClientId, values, this.id);
    //       }
    //       function stopDrag() {
    //           this.removeEventListener('mousemove', drag);
    //           this.removeEventListener('mouseup', stopDrag);

    //       }
    //       this.addEventListener('mousemove', drag);
    //       this.addEventListener('mouseup', stopDrag);
    //   });
    //   userComments.addEventListener('dblclick', function remove(){
    //     socket.emit('delete comments', gClientId, values, this.id);
    //     this.remove();
    //   });
    //   document.body.appendChild(userComments);
    //   var x = values.x - textOnCanvas.offsetLeft,
    //       y = values.y - textOnCanvas.offsetTop;
    //   userComments.value = "x: " + x + " y: " + y;
    //   userComments.style.top = values.y + 'px';
    //   userComments.style.left = values.x + 'px';
    //   textareaindex = commentId + 1;
  });

  socket.on("updated comment", function(commentId, comment) {
    comments[commentId] = comment;
    rerenderComments();
  });

  // socket.on("drag comments", function(clientID, values, commentId){
  //   console.log(values.x + ' '+values.y);
  //   var userComments = document.getElementById(commentId);
  //     userComments.style.top = values.y + 'px';
  //     userComments.style.left = values.x + 'px';
  // });

  socket.on("delete comments", function(commentId) {
    comments[commentId] = undefined;
    rerenderComments();
    // console.log(values.x + ' '+values.y);
    // var userComments = document.getElementById(commentId);
    //   userComments.remove();
  });

  socket.on("draw point", function(data_point, counter){
    var mouseX = data_point.location_x;
    var mouseY = data_point.location_y;
    var otherClientId = data_point.clientId;
    var color = data_point.color;

    if(data_point.starting){
      addClick(otherClientId, mouseX, mouseY, color, false);
    }
    else{
      addClick(otherClientId, mouseX, mouseY, color, true);
    }
    redraw();
  });

  socket.on("initialize", function(clientId, r_points, allowChangePassword){

    $('#password-modal').modal('hide');


    gClientId = clientId;
    var other_points = {};
    var client_color = "white";
    $('.mainSection .avatar-section').append("<label class='client' style='color: yellow;' data-value='-1'>DEF</label>");

    if( allowChangePassword ){
      $('#passwordArea').css('display', 'inline');
    }

    $.each(r_points, function(other_clientId, other_points) {
      // $('.mainSection').append("<label class='client' style='color: " + client_color + ";' data-value='" + other_clientId + "'>" + other_clientId + "</label>");
      $.each(other_points, function(index, other_point) {
        addClick(other_clientId, other_point.location_x, other_point.location_y, other_point.color, !other_point.starting);
      });
    });
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

}); // document.ready
