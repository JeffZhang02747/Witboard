var Comment = require('./Comment.js');


function isValidPassword(candidatePassword) {
    return candidatePassword.length >= 8;
}




module.exports = {
    // constructor function
    // a BoardDirector encapsulates the back-end code and state of a board with the
    // given boardId and the given boardNameSpace (a socket.io namespace);
    // also need the argument newBoardFunc for a function that creates a new board
    BoardDirector: function(boardId, boardNameSpace, newBoardFunc) {
        this.boardId = boardId;
        this.boardNameSpace = boardNameSpace;

        this.nextClientId = 0;
        this.firstId = 0;

        this.password = undefined;      // a password value of null or undefined
                                        // means the board is not password-protected

        // state about the current drawing
        // an object used as a map associating client ids to arrays of data_point
        // fs.
        this.drawingData = {};
        // comments data (TODO which datastructure?)
        this.comments = new Array();
        // array of client ids for the still active (not disconnected) clients,
        // ordered by activity (from most recently active to least recently active)
        this.activeClientIds = new Array();

        ///////////////////// method definitions start ///////////////////

        this.notifyAboutActiveClients = function() {
            this.boardNameSpace.emit('active user list updated', this.activeClientIds);
        }

        // call this method when a client just got active; pass in the id for that client;
        // notifies users if necessary
        // safe when clientId is not in activeClientIds (in that case it's just added to the front)
        this.updateClientActivity = function(clientId) {
            if (this.activeClientIds[0] !== clientId) {
                // move clientId to the front of the array..
                var idx = this.activeClientIds.indexOf(clientId);
                if (idx >= 0) {
                    this.activeClientIds.splice(idx, 1);
                }
                this.activeClientIds.unshift(clientId);

                this.notifyAboutActiveClients();
            }
        };

        this.setUpCommentHandlers = function (clientId, socket) {
            var boardDirector = this;

            // returns the comment to edit/delete if valid, or undefined otherwise.
            // if invalid, also notifies the client
            var checkIfValidEdit = function (commentId) {
                console.log("checkif valid");
                console.log(commentId);


                var comment = boardDirector.comments[commentId];
                if (typeof(comment) === 'undefined') {
                    socket.emit('invalid edit/delete comment', 
                                'Provided comment id does not point to an existing comment.')
                    return undefined;
                }
                if (comment.authorClientId !== clientId) {
                    socket.emit('invalid edit/delete comment', 
                                "Comment to edit/delete isn't authored by you! Cannot edit comments by others!")
                    return undefined;
                }

                return comment;
            };


            socket.on('add comment', function(message, xPos, yPos) {
                console.log("get new comment");
                // commentId is the same as the index to boardDirector.comments
                var commentId = boardDirector.comments.length;
                var newComment = new Comment.Comment(clientId, message, xPos, yPos);
                boardDirector.comments.push(newComment);

                socket.emit('id for new comment', commentId);
                socket.broadcast.emit('new comment', commentId, newComment);
                boardDirector.updateClientActivity(clientId);
            });

            socket.on('edit comment', function(commentId, message, xPos, yPos) {
                console.log("get edit comment");

                var comment = checkIfValidEdit(commentId);

                if (!comment) { console.log("not a comment"); return; }

                comment.message = message;
                comment.xPos = xPos;
                comment.yPos = yPos;

                socket.broadcast.emit('updated comment', commentId, comment);
                boardDirector.updateClientActivity(clientId);
            });

            socket.on('delete comment', function(commentId) {
                var comment = checkIfValidEdit(commentId);
                if (!comment) { return; }

                boardDirector.comments[commentId] = undefined;

                socket.broadcast.emit('deleted comment', commentId);
                boardDirector.updateClientActivity(clientId);
            });
        }

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
            var allowChangePassword = clientId == boardDirector.firstId;
            if ( allowChangePassword ) {        // this connection is with board creator
                socket.on("set-password", function(newPassword) {
                    if (isValidPassword(newPassword)) {
                        boardDirector.password = newPassword;
                        socket.emit('password change successful');
                        return;
                    }
                    socket.emit('invalid-password', 'The password must be at least 8 characters long!');
                });
            }


            socket.on('new board', function() {
                var retId = newBoardFunc();
                socket.emit('board created', retId);
            });

            socket.on("draw point", function(data_point, counter){
                boardDirector.drawingData[clientId].push(data_point);
                socket.broadcast.emit('draw point', data_point, counter);
                boardDirector.updateClientActivity(clientId);
            });

            this.setUpCommentHandlers(clientId, socket);

            socket.on("highlight", function(x, y){
                socket.broadcast.emit('highlight', x, y, clientId);
            });

            socket.on('disconnect', function() {
                var idx = boardDirector.activeClientIds.indexOf(clientId);
                if (idx >= 0) {
                    boardDirector.activeClientIds.splice(idx, 1);
                } else {
                    throw "client with clientId: " + clientId + " disconnected but was never added to activeClientIds!?";
                }

                boardDirector.notifyAboutActiveClients();
            });

            // the initialize event is only sent when the user is granted access to the board
            socket.emit("initialize", clientId, this.drawingData, allowChangePassword, this.comments);


            socket.on('clone board', function() {
                var retId = global.collection.cloneBoard(boardDirector.drawingData, boardDirector.nextClientId);
                socket.emit('board created', retId);
            });

            this.updateClientActivity(clientId);
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