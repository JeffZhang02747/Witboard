
  function canvasReact(){
    $('#canvas').off(mouseDown);
    $('#canvas').off(mouseUp);
    $('#canvas').off(mouseMove);
    $('#canvas').off(mouseLeave);
    $('#canvas').off(click);

    if(!highlightMode){
      bindCanvasDraw();
    }
    else{
      bindCanvasHighlight();
    }
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

  function showHighlight(x, y, clientId){
    ableFade = false;
    $('a.popFade').css('top', y);
    $('a.popFade').css('left', x);
    $('a.popFade').text(clientId);
    $('a.popFade').fadeIn('fast').delay(1000).fadeOut('fast', function(){ableFade = true; });
  }


  // copied from Stroke.js because frontend code can't access backend js
  function StrokeData(colorId = 0, isEraserStroke = false) {
      this.colorId = colorId;
      this.isEraserStroke = isEraserStroke; // if true, represents that the stroke is eraser sized
      this.dataPoints = new Array();  // array where each element represents data about a drawn point
  }

  // also responsible for adding elements to strokeMap if a new authorClientId is encountered
  function addStrokeIfNotExist(authorClientId, authorStrokeId) {
    var clientsStrokeArray = strokeMap[authorClientId];
    if (typeof(clientsStrokeArray) === 'undefined') {
      strokeMap[authorClientId] = new Array();
      clientsStrokeArray = strokeMap[authorClientId];
    }

    if (typeof(clientsStrokeArray[authorStrokeId]) === 'undefined') {
      clientsStrokeArray[authorStrokeId] = new StrokeData();
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


  function passwordInit(){
    if(passwordRequired){
      $('#password-modal').modal({
        keyboard: false,
        backdrop: 'static'
      });
    }
  }