module.exports = {
    // constructor function
    // a BoardDirector encapsulates the back-end code and state of a board with the
    // given boardId and the given boardNameSpace (a socket.io namespace)
    BoardDirector: function(boardId, boardNameSpace) {
        this.boardId = boardId;
        this.boardNameSpace = boardNameSpace;

        this.nextClientId = 0;

        // state about the current drawing (TODO)

        // persists current state to the database
        this.saveToDB = function() {} // TODO implement!
        // populate current state with data from the database
        this.loadFromDB = function() {} // TODO implement!

        var boardDirector = this;       // allows easier access to this in nested
                                        // function scope below
        // initialization
        this.boardNameSpace.on('connection', function(socket){
            console.log('someone connected on board ' + boardId);

            socket.on("draw point", function(data_point, counter){
                socket.broadcast.emit('draw point', data_point, counter);
            });

            socket.emit("initialize", boardDirector.nextClientId);
            boardDirector.nextClientId++;
        });
    }
} // module.exports
    