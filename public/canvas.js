$(document).ready(function(){
var socket = io.connect(window.location.hostname);
var typed = false;
var timeout = undefined;

context = document.getElementById('canvas').getContext("2d");

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;

function addClick(x, y, dragging)
{
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
}

var counter = 0;
var data_point = {};

$('#canvas').mousedown(function(e){
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;
    
  paint = true;
  addClick(mouseX, mouseY);
  redraw();
  data_point.location_x = mouseX;
  data_point.location_y = mouseY;
  console.log("x:" + mouseX);
  console.log("y:" + mouseY);

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
    console.log("x:" + mouseX);
    console.log("y:" + mouseY);

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

  // console.log("counter " + counter);
  console.log("x:" + mouseX);
  console.log("y:" + mouseY);
  addClick(mouseX, mouseY);
  redraw();
})
});