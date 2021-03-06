var Comment = require('./Comment.js');
var db = require('./db.js');
var Stroke = require('./Stroke.js');


function isValidPassword(candidatePassword) {
    return candidatePassword.length >= 8;
}


module.exports = {
    // constructor function
    // a BoardDirector encapsulates the back-end code and state of a board with the
    // given boardId and the given boardNameSpace (a socket.io namespace);
    // also need the argument newBoardFunc for a function that creates a new board
    BoardDirector: function(boardId, boardNameSpace, newBoardFunc) {

        // this inner class is responsible for maintaing the board state and handling
        // socket events that affect board state
        var BoardState = function(boardNameSpace, boardDirector) {
            this.boardNameSpace = boardNameSpace;
            this.boardDirector = boardDirector;

            // array of StrokeIds ordered by time received (when the stroke started);
            this.orderedStrokeIds = new Array();
            // object (used like a map) of client id to (an array of StrokeData drawn by client of client id);
            // the index to the inner array is the same as the authorStrokeId
            this.strokeMap = {};
            // comments data
            // an array of Comment objects with array index being equivalent to the comment id 
            this.comments = new Array();

            // array of client ids for the still active (not disconnected) clients,
            // ordered by activity (from most recently active to least recently active)
            this.activeClientIds = new Array();

            this.timeOutSave = null;

            ///////////////////// private methods start ///////////////////

            this.notifyAboutActiveClients = function() {
                this.boardNameSpace.emit('active user list updated', this.activeClientIds);
            }

            // call this method when a client just got active; pass in the id for that client;
            // notifies users if necessary
            // safe to call when clientId is not in activeClientIds (in that case
            // it's just added to the front of activeClientIds)
            this.updateClientActivity = function(clientId) {
                if (this.activeClientIds[0] !== clientId) {
                    // move clientId to the front of the array..
                    var idx = this.activeClientIds.indexOf(clientId);
                    if (idx >= 0) {
                        this.activeClientIds.splice(idx, 1);
                    }
                    this.activeClientIds.unshift(clientId);
                    this.boardDirector.saveToDB();
                    this.notifyAboutActiveClients();
                }
            };

            this.setUpCommentHandlers = function (clientId, socket) {
                var boardState = this;

                // returns the comment to edit/delete if valid, or undefined otherwise.
                // if invalid, also notifies the client
                var checkIfValidEdit = function (commentId) {
                    var comment = boardState.comments[commentId];
                    if (comment == null) {
                        socket.emit('invalid edit/delete comment', 
                                    'Provided comment id does not point to an existing comment.')
                        console.log("Provided comment id does not point to an existing comment.");
                        return undefined;
                    }

                    if (typeof(comment) === 'undefined') {
                        socket.emit('invalid edit/delete comment', 
                                    'Provided comment id does not point to an existing comment.')
                        console.log("Provided comment id does not point to an existing comment.");
                        return undefined;
                    }
                    if (comment.authorClientId !== clientId) {
                        socket.emit('invalid edit/delete comment', 
                                    "Comment to edit/delete isn't authored by you! Cannot edit comments by others!")
                        console.log("Comment to edit/delete isn't authored by you! Cannot edit comments by others!");
                        return undefined;
                    }

                    return comment;
                };


                socket.on('add comment', function(message, xPos, yPos) {
                    // commentId is the same as the index to boardState.comments

                    var commentId = boardState.comments.length;
                    var newComment = new Comment.Comment(clientId, message, xPos, yPos);
                    boardState.comments.push(newComment);

                    socket.emit('id for new comment', commentId);
                    socket.broadcast.emit('new comment', commentId, newComment);
                    boardState.updateClientActivity(clientId);
                    boardState.boardDirector.saveToDB();
                });

                socket.on('edit comment', function(commentId, message, xPos, yPos) {
                    var comment = checkIfValidEdit(commentId);

                    if (!comment) { return; }

                    comment.message = message;
                    comment.xPos = xPos;
                    comment.yPos = yPos;

                    socket.broadcast.emit('updated comment', commentId, comment);
                    
                    boardState.updateClientActivity(clientId);
                    boardState.boardDirector.saveToDB();
                });

                socket.on('delete comment', function(commentId) {
                    var comment = checkIfValidEdit(commentId);
                    if (!comment) { return; }

                    boardState.comments[commentId] = null;

                    socket.broadcast.emit('deleted comment', commentId);
                    boardState.updateClientActivity(clientId);
                    boardState.boardDirector.saveToDB();
                });
            } // setUpCommentHandlers

            ///////////////////// private methods end ///////////////////

            ///////////////////// public methods start ///////////////////

            // set up state and handlers for user with the socket connection and clientId
            // TODO when we can refactor the front-end event handlers, refactor
            // "initialize"'s handler and move allowChangePassword out of this function
            this.setUpAccessForUser = function(clientId, socket, allowChangePassword) {
                this.strokeMap[clientId] = new Array();

                var boardState = this; // so that this is available in enclosed functions

                var clientsStrokeArray = this.strokeMap[clientId];
                // this function is responsible for keeping order in orderedStrokeIds
                var addStrokeIfNotExist = function(authorStrokeId) {
                    if (authorStrokeId >= clientsStrokeArray.length) {
                        if (authorStrokeId != clientsStrokeArray.length) {
                            throw 'authorStrokeId is larger than clientsStrokeArray.length!'
                                + ' (authorStrokeId: ' + authorStrokeId + ', clientsStrokeArray.length: ' 
                                + clientsStrokeArray.length + ')';
                        }

                        clientsStrokeArray.push(new Stroke.StrokeData());
                        boardState.orderedStrokeIds.push(new Stroke.StrokeId(clientId, authorStrokeId));
                        boardState.boardNameSpace.emit('ordered stroke array updated', boardState.orderedStrokeIds);
                    }
                }

                // send this event when starting a stroke to set its properties
                socket.on('set stroke properties', function(authorStrokeId, colorId, isEraserStroke) {
                    addStrokeIfNotExist(authorStrokeId);
                    clientsStrokeArray[authorStrokeId].colorId = colorId;
                    clientsStrokeArray[authorStrokeId].isEraserStroke = isEraserStroke;

                    socket.broadcast.emit('stroke properties updated', clientId, authorStrokeId,
                            colorId, isEraserStroke);
                });

                socket.on("draw point", function(authorStrokeId, data_point){
                    addStrokeIfNotExist(authorStrokeId);
                    clientsStrokeArray[authorStrokeId].dataPoints.push(data_point);

                    socket.broadcast.emit('draw point', clientId, authorStrokeId, data_point);
                    boardState.updateClientActivity(clientId);

                    // automatic DB saving
                    if (boardState.timeOutSave != null) {
                        clearTimeout(boardState.timeOutSave);                // stop last timer 
                    }
                    boardState.timeOutSave = setTimeout( function() {
                        boardState.boardDirector.saveToDB();
                    }, 5000);
                });

                this.setUpCommentHandlers(clientId, socket);

                socket.on("highlight", function(x, y){
                    socket.broadcast.emit('highlight', x, y, clientId);
                });

                socket.on('disconnect', function() {
                    var idx = boardState.activeClientIds.indexOf(clientId);
                    if (idx >= 0) {
                        boardState.activeClientIds.splice(idx, 1);

                    } else {
                        throw "client with clientId: " + clientId + " disconnected but was never added to activeClientIds!?";
                    }

                    boardState.notifyAboutActiveClients();
                });

                // the initialize event is only sent when the user is granted access to the board
                socket.emit("initialize", clientId, this.orderedStrokeIds, this.strokeMap, allowChangePassword, this.comments);

                this.updateClientActivity(clientId);
            }; // setUpAccessForUsers

            this.cloneTo = function(destinationBoardState) {
                destinationBoardState.orderedStrokeIds = this.orderedStrokeIds;
                destinationBoardState.strokeMap = this.strokeMap;
                // don't clone comments (this is simply a design choice)
            }

            this.saveToSaveObj = function(saveObj) {
                saveObj.orderedStrokeIds = this.orderedStrokeIds;
                saveObj.strokeMap = this.strokeMap;
                saveObj.comments = this.comments;
                saveObj.activeClientIds = this.activeClientIds;
            };

            this.loadFromObj = function(obj) {
                if (obj.orderedStrokeIds != undefined) {
                    this.orderedStrokeIds = obj.orderedStrokeIds;
                }
                if (obj.strokeMap != undefined) {
                    this.strokeMap = obj.strokeMap;
                }
                if (obj.comments != undefined) {
                    this.comments = obj.comments;
                }
                // don't want to load activeClientIds (TODO then don't save it in the first place?)
            }

            ///////////////////// public methods end ///////////////////
            
        }; // BoardState

        this.boardId = boardId;
        this.boardNameSpace = boardNameSpace;

        this.nextClientId = 0;
        this.firstId = 0;

        this.password = null;      // a password value of null or undefined
                                   // means the board is not password-protected

        this.boardState = new BoardState(this.boardNameSpace, this);

        ///////////////////// private methods start ///////////////////

        // verify the user connected through socket;
        // If verification is successful, then access is granted to the user
        this.verifyUser = function(socket) {
            if (this.password === null) {
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

            socket.on('clone board', function() {
                var retId = global.collection.cloneBoard(boardDirector);
                socket.emit('board created', retId);
            });

            this.boardState.setUpAccessForUser(clientId, socket, allowChangePassword);
        };

        ///////////////////// private methods end ///////////////////

        ///////////////////// public methods start ///////////////////

        var boardDirector = this;

        this.saveToDB = function() {
            saveObj = {}
            saveObj.boardId = this.boardId;
            saveObj.nextClientId = this.nextClientId;
            saveObj.firstId = this.firstId;
            saveObj.password = this.password;
            // saveObj.orderedStrokeIds = this.orderedStrokeIds;
            // saveObj.strokeMap = this.strokeMap;
            // saveObj.comments = this.comments;
            // saveObj.activeClientIds = this.activeClientIds;
            this.boardState.saveToSaveObj(saveObj);
            db.saveBoard(saveObj.boardId, saveObj);
        };

        this.loadFromDB = function(obj) {
            if (obj.nextClientId != undefined) {
                this.nextClientId = obj.nextClientId;
            }
            if (obj.firstId != undefined) {
                this.firstId = obj.firstId;
            }
            if (obj.password != undefined) {
                this.password = obj.password;
            }
            this.boardState.loadFromObj(obj);
        };

        this.cloneTo = function(destinationBoard) {
            destinationBoard.nextClientId = this.nextClientId;
            destinationBoard.firstId = this.nextClientId; // destinationBoard's
                                // first user will have this.nextClientId as id
            this.boardState.cloneTo(destinationBoard.boardState);
        }

        ///////////////////// public methods end ///////////////////

        var boardDirector = this;
        // initialization
        this.boardNameSpace.on('connection', function(socket){
            console.log('someone connected on board ' + boardId);
            boardDirector.verifyUser(socket);
        });
    }

} // module.exports