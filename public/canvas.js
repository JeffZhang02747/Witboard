$(document).ready(function(){
  var currBoardId = getCurrBoardId(); // TODO do something with this!
  var socket;
  if (currBoardId) {
    socket = io('/' + currBoardId);
  } else {
    socket = io.connect(window.location.hostname);
  }
  var mycomments = {};
  var showText = false;
  var textarea = null;
  var textareaindex = 0;
  var textareahidden = false;
  var timeout = undefined;
  var date = new Date();
  var passcode = date.getTime();
  var counter = 0;
  var data_point = {};
  var gClientId = -1;
  var passwordRequired = false;

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


  // returns the current board id if it exists, returns null otherwise
  function getCurrBoardId() {
    var re = new RegExp("/([0-9]+)$");
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

  $('#color01').click(function(e){
    gColor = 0;
  });
  $('#color02').click(function(e){
    gColor = 1;
  });
  $('#color03').click(function(e){
    gColor = 2;
  });
  $('#color04').click(function(e){
    gColor = 3;
  });
  $('#color05').click(function(e){
    gColor = 4;
  });
  $('#color06').click(function(e){
    gColor = 5;
  });
  $('#color07').click(function(e){
    gColor = 6;
  });

  $('#downloadButton').click(function(e) {
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

  $('#hideTextArea').click(function(e){

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

  $('#newBoardButton').click(function(e) {
    // TODO redirect to new board.
    socket.emit('new board');
  });

  $('#textBoxButton').click(function(e) {
    // TODO redirect to new board.
    if (showText == false){
      showText = true;
    }
    else {
      showText = false;
    }
  });

  $('#canvas').mousedown(function(e){

    if(showText){
      var textOnCanvas = document.getElementById('canvas');
      mycomments[textareaindex] = document.createElement('textarea');
      mycomments[textareaindex].className = 'info';
      mycomments[textareaindex].name = 'textarea' + textareaindex;
      mycomments[textareaindex].id = textareaindex;
      mycomments[textareaindex].addEventListener('mousedown', function mouseDownOnTextarea(e) {
          var currentIndex = this.id;
          var x = mycomments[currentIndex].offsetLeft - e.clientX,
              y = mycomments[currentIndex].offsetTop - e.clientY;
          function drag(e) {
              mycomments[currentIndex].style.left = e.clientX + x + 'px';
              mycomments[currentIndex].style.top = e.clientY + y + 'px';
          }
          function stopDrag() {
              document.removeEventListener('mousemove', drag);
              document.removeEventListener('mouseup', stopDrag);
          }
          document.addEventListener('mousemove', drag);
          document.addEventListener('mouseup', stopDrag);
      });
      mycomments[textareaindex].addEventListener('dblclick', function remove(){
        this.remove();
      });
      document.body.appendChild(mycomments[textareaindex]);
      var x = e.clientX - textOnCanvas.offsetLeft,
          y = e.clientY - textOnCanvas.offsetTop;
      mycomments[textareaindex].value = "x: " + x + " y: " + y;
      mycomments[textareaindex].style.top = e.clientY + 'px';
      mycomments[textareaindex].style.left = e.clientX + 'px';
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

  $('#canvas').mousemove(function(e){
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

  $('#canvas').mouseup(function(e){
    paint = false;
  });

  $('#canvas').mouseleave(function(e){
    paint = false;
  });

  function passwordInit(){
    if(passwordRequired){
      $('#password-modal').modal({
        keyboard: false,
        backdrop: 'static'
      });
    }
  }

  $(document).on('click', '#verify-submit', function(e){
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

  socket.on("initialize", function(clientId, r_points){
    $('#password-modal').modal('hide');

    gClientId = clientId;
    var other_points = {};
    var client_color = "white";
    $('.mainSection').append("<label class='client' style='color: yellow;' data-value='-1'>DEF</label>");

    if(clientId == 0){
      $('#passwordArea').css('display', 'inline');
    }

    $.each(r_points, function(other_clientId, other_points) {
      if(other_clientId == clientId){
        client_color = "red";
      }
      $('.mainSection').append("<label class='client' style='color: " + client_color + ";' data-value='" + other_clientId + "'>" + other_clientId + "</label>");
      $.each(other_points, function(index, other_point) {
        addClick(other_clientId, other_point.location_x, other_point.location_y, other_point.color, !other_point.starting);
      });
    });
    redraw();

  });



  socket.on('board created', function(newBoardId) {
    // socket = io(window.location.hostname + newBoardId);
    // debugger;
    window.location.href += newBoardId;
  });

  socket.on('welcome', function(clientId) {
      $('.mainSection').append("<label class='client' style='color: white;' data-value='" + clientId + "'>" + clientId + "</label>");
  });

  socket.on('user left', function(clientId){
    $('label.client[data-value="' + clientId + '"]').remove();
  });

  $(document).on('click', '.client', function(e){
    redraw($(this).attr('data-value'));
  });

  $(document).on('click', 'button#setPassword', function(e){
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
