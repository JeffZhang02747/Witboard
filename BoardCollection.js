var BoardDirector = require('./BoardDirector.js');
var db = require('./db.js');

// following function is from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
  
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}


module.exports = {


    BoardCollection: function( io ) {

        var newBoard = function() {
            var newBoardId = guid();
            while (newBoardId in boardDirectorMap 
                    || !(newBoardId >= '0' && newBoardId <= '9')) { // somehow id's that start with a letter breaks stuff..
                newBoardId = guid();
            }
            var boardNameSpace = io.of('/' + newBoardId);
            boardDirectorMap[newBoardId] = new BoardDirector.BoardDirector(newBoardId, boardNameSpace, newBoard);
            boardDirectorMap[newBoardId].saveToDB();
            return newBoardId;
        };


        boardDirectorMap = {};

        var rebuildBoard = function(boardData) {
            var oldBoardId = boardData.boardId;

            var boardNameSpace = io.of('/' + oldBoardId);
            boardDirectorMap[oldBoardId] = new BoardDirector.BoardDirector(oldBoardId, boardNameSpace, newBoard);
            boardDirectorMap[oldBoardId].loadFromDB(boardData);
        }

        db.getBoards( function(retObj) {
            if (retObj != null ) {
                for ( var key in retObj ) {
                    rebuildBoard( retObj[key] );
                }
            }
        });


        io.on('connection', function(socket){
            var retId = newBoard();
            socket.emit('board created', retId);
        });

        // clone a new board given drawingData
        this.cloneBoard = function(orderedStrokeIds, strokeMap, nextId) {
            var retId = newBoard();
            // TODO shouldn't have to reference boardState.orderedStrokeIds
            boardDirectorMap[retId].boardState.orderedStrokeIds = orderedStrokeIds;
            boardDirectorMap[retId].boardState.strokeMap = strokeMap;
            boardDirectorMap[retId].nextClientId = nextId;
            boardDirectorMap[retId].firstId = nextId;
            boardDirectorMap[retId].saveToDB();
            return retId;
        }
    }
}


// module.exports