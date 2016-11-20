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
  var oldTempComment = undefined; 


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
  var ableFade = true;

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
        // comment part
        if(showText){
          showText = false;
          newTempComment = {};
          newTempComment.authorClientId = gClientId;
          newTempComment.message = "";
          newTempComment.xPos = e.clientX;
          newTempComment.yPos = e.clientY;

          rerenderComments();
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
    console.log( comments );

    $('.info').remove();

    function addTextArea(commentId, comment) {
      if (!comment) {
        return;
      }

      var division = document.createElement('div'); 
      division.className = 'info';
      division.id = commentId;

      var label = document.createElement('label');
      label.className = 'textareaLabel';
      if (comment.authorClientId == gClientId){
        label.innerHTML = "You";
        label.style.color = 'blue';
      }
      else{
        var userName = "User#" + String(comment.authorClientId+1);
        label.innerHTML = userName;
        label.style.color = 'red';
      }
      
      var userComments = document.createElement('textarea');
      userComments.name = 'textarea' + textareaindex;
      userComments.className = 'userComment';

      division.addEventListener('mousedown', function mouseDownOnTextarea(e) {
          var x = this.offsetLeft - e.clientX,
              y = this.offsetTop - e.clientY;
          function drag(e) {
              this.style.left = e.clientX + x + 'px';
              this.style.top = e.clientY + y + 'px';
              comment.value = this.children[1].value;
              comment.xPos = parseInt(division.style.left);
              comment.yPos = parseInt(division.style.top);
              // debugger;
              // console.log('is this getting called? ', this.id);
              socket.emit("edit comment", this.id, this.children[1].value, parseInt(this.style.left), parseInt(this.style.top) );
          }
          function stopDrag() {
              this.removeEventListener('mousemove', drag);
              this.removeEventListener('mouseup', stopDrag);
          }
          this.addEventListener(mouseMove, drag);
          this.addEventListener(mouseUp, stopDrag);
      });
      division.addEventListener('dblclick', function remove(){
        comments[commentId] = undefined;
        this.remove();
        socket.emit('delete comment', division.id);
      });

      var commited = false;
      userComments.addEventListener('blur', function() {
        console.log( userComments.value );
        console.log("blur this");
        if (userComments.value != "") {
          comment.message = userComments.value;
          comment.xPos = parseInt(division.style.left);
          comment.yPos = parseInt(division.style.top);
          if (commentId == "tempId" && !commited) {
            commited = true;

            console.log(division.style.left + ' and ' + division.style.top );
            socket.emit("add comment", userComments.value, parseInt(division.style.left), parseInt(division.style.top) );
            socket.on("id for new comment", function(commentId) {
               division.id = commentId;
               comments[commentId] = comment;
               newTempComment = undefined;
            });
          } else {
              console.log(division.style.left + ' and ' + division.style.top );
              socket.emit("edit comment", this.id, userComments.value, parseInt(division.style.left), parseInt(
              division.style.top));
          }
        }
      })

      userComments.value = comment.message;
      division.style.top = comment.yPos + 'px';
      division.style.left = comment.xPos + 'px';
      console.log(division.id);
      console.log('I WANT to render this message:' + userComments.value + '   x: ' + comment.xPos + '   y: ' + comment.yPos);
      document.body.appendChild(division);
      document.getElementById(commentId).appendChild(label);
      document.getElementById(commentId).appendChild(userComments);
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
    if (typeof(oldTempComment) !== "undefined") {
      addTextArea("oldTempId", oldTempComment);
    }
  }

  socket.on("new comment", function(commentId, comment){
    console.log("wow this comment");

    comments[commentId] = comment;
    rerenderComments();

  });

  socket.on("updated comment", function(commentId, comment) {
    comments[commentId] = comment;
    console.log("comment update received");
    console.log(comment);
    rerenderComments();
  });


  socket.on("deleted comment", function(commentId) {
    comments[commentId] = undefined;
    rerenderComments();
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

  socket.on("initialize", function(clientId, r_points, allowChangePassword, passedComments){

    $('#password-modal').modal('hide');
    comments = passedComments;
    rerenderComments();


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
