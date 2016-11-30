  var currBoardId = undefined; // TODO do something with this!
  var socket = undefined;
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

  var lastShowClient = -1;

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
