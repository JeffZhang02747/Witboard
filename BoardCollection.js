var BoardDirector = require('./BoardDirector.js');


module.exports = {

    BoardCollection: function( io ) {

        boardDirectorMap = new Map();
        var nextBoardId = 1;


        var newBoard = function() {
            var newBoardId = nextBoardId;
            nextBoardId++;
            var boardNameSpace = io.of('/' + newBoardId);
            boardDirectorMap[newBoardId] = new BoardDirector.BoardDirector(newBoardId, boardNameSpace);
            return newBoardId;
        }


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