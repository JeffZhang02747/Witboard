var BoardDirector = require('./BoardDirector.js');

// following function is from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
  
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}


module.exports = {

    BoardCollection: function( io ) {

        boardDirectorMap = new Map();


        var newBoard = function() {
            var newBoardId = guid();
            while (newBoardId in boardDirectorMap) {
                newBoardId = guid();
            }
            
            var boardNameSpace = io.of('/' + newBoardId);
            boardDirectorMap[newBoardId] = new BoardDirector.BoardDirector(newBoardId, boardNameSpace);
            return newBoardId;
        };


        io.on('connection', function(socket){
            socket.on('new board', function() {
                var retId = newBoard();
                socket.emit('board created', retId);
            });
        });


        // clone a new board given drawingData
        this.cloneBoard = function(drawingData, nextId) {

            var retId = newBoard();
            var cloneDrawing = JSON.parse(JSON.stringify(drawingData));

            boardDirectorMap[retId].drawingData = cloneDrawing;
            boardDirectorMap[retId].nextClientId = nextId;
            boardDirectorMap[retId].firstId = nextId;


            console.log("clone board inside");

            var cloneDrawing = JSON.parse(JSON.stringify(drawingData));
            console.log(cloneDrawing);


            return retId;
        }
    }
}


// module.exports