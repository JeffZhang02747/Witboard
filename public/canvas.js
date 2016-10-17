$(document).ready(function(){
var currBoardId = getCurrBoardId(); // TODO do something with this!
var socket = io.connect(window.location.hostname);
var typed = false;
var timeout = undefined;

context = document.getElementById('canvas').getContext("2d");

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;

// returns the current board id if it exists, returns null otherwise
function getCurrBoardId() {
  var re = new RegExp("/([0-9]+)$");
  var regexMatches = re.exec(window.location.href);
  if (!regexMatches || !(regexMatches[1])) {
    return null; 
  }
  return regexMatches[1];
}

function addClick(x, y, dragging)
{
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
}

var counter = 0;
var data_point = {};

$('#newBoardButton').click(function(e) {
  // TODO redirect to new board.
  socket.emit('new board');
});

$('#canvas').mousedown(function(e){
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;
    
  paint = true;
  addClick(mouseX, mouseY);
  redraw();
  data_point.location_x = mouseX;
  data_point.location_y = mouseY;
    data_point.starting = true;

  counter += 1;
  socket.emit("draw point", data_point, counter);
});

$('#canvas').mousemove(function(e){
  if(paint){
    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;
    addClick(mouseX, mouseY, true);
    redraw();
    data_point.location_x = mouseX;
    data_point.location_y = mouseY;
    data_point.starting = false;

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

function redraw(){
  context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
  
  context.strokeStyle = "#df4b26";
  context.lineJoin = "round";
  context.lineWidth = 5;
      
  for(var i=0; i < clickX.length; i++) {    
    context.beginPath();
    if(clickDrag[i] && i){
      context.moveTo(clickX[i-1], clickY[i-1]);
     }else{
       context.moveTo(clickX[i]-1, clickY[i]);
     }
     context.lineTo(clickX[i], clickY[i]);
     context.closePath();
     context.stroke();
  }
}

socket.on("draw point", function(data_point, counter){
  var mouseX = data_point.location_x;
  var mouseY = data_point.location_y;

  if(data_point.starting){
    addClick(mouseX, mouseY);
  }
  else{
    addClick(mouseX, mouseY, true);
  }
  redraw();
})

socket.on('board created', function(newBoardId) {
  // socket = io(window.location.hostname + newBoardId);
  // debugger;
  window.location.href += newBoardId;
});
});