function isValidPassword(candidatePassword) {
    return candidatePassword.length >= 8;
}



module.exports = {
    // constructor function
    // a BoardDirector encapsulates the back-end code and state of a board with the
    // given boardId and the given boardNameSpace (a socket.io namespace)
    BoardDirector: function(boardId, boardNameSpace) {
        this.boardId = boardId;
        this.boardNameSpace = boardNameSpace;

        this.nextClientId = 0;

        this.password = undefined;      // a password value of null or undefined
                                        // means the board is not password-protected

        // state about the current drawing
        // an object used as a map associating client ids to arrays of data_point
        // objects.
        this.drawingData = {};

        ///////////////////// method definitions start ///////////////////

        // verify the user connected through socket;
        // If verification is successful, then access is granted to the user
        this.verifyUser = function(socket) {
            if (typeof(this.password) === 'undefined') {
                this.grantAccessToUser(socket);
                return;
            }

            var boardDirector = this;
            socket.on('verify with password', function(password) {
                if (password === boardDirector.password) {
                    boardDirector.grantAccessToUser(socket);
                    return;
                }

                socket.emit('incorrect password');
            });

            socket.emit('password required');
        };

        // grant board access to the user connected through socket;
        this.grantAccessToUser = function(socket) {
            // TODO make sure that this method is safe against multiple calls with the same socket argument

            var clientId = this.nextClientId;
            this.nextClientId++;

            this.drawingData[clientId] = new Array();

            var boardDirector = this;
            if (clientId == 0) {        // this connection is with board creator
                socket.on("set-password", function(newPassword) {
                    if (isValidPassword(newPassowrd)) {
                        boardDirector.password = newPassword;
                        return;
                    }
                    socket.emit('invalid-password', 'The password must be at least 8 characters long!');
                });
            }

            socket.on("draw point", function(data_point, counter){
                boardDirector.drawingData[clientId].push(data_point);
                socket.broadcast.emit('draw point', data_point, counter);
            });

            socket.on("highlight", function(x, y){
                socket.broadcast.emit('highlight', x, y, clientId);
            });

            socket.on('disconnect', function() {
                socket.broadcast.emit('user left', clientId);
            });

            // the initialize event is only sent when the user is granted access to the board
            socket.emit("initialize", clientId, this.drawingData);

            socket.broadcast.emit('welcome', clientId);
        };

        // persists current state to the database
        this.saveToDB = function() {}; // TODO implement!
        // populate current state with data from the database
        this.loadFromDB = function() {}; // TODO implement!


        //////////////////// method end definitions //////////////////////

        var boardDirector = this;
        // initialization
        this.boardNameSpace.on('connection', function(socket){
            console.log('someone connected on board ' + boardId);
            boardDirector.verifyUser(socket);
        });
    }
} // module.exports
    