// firebase connection
(function() {

	var admin = require("firebase-admin");
	var request = require('request');

	var keyLoc = "witboardKey.json";
	var databaseURL = "https://witboard-6b200.firebaseio.com";

	admin.initializeApp({
	    credential: admin.credential.cert(keyLoc),
	    databaseURL: databaseURL
	});

	var db = admin.database();
	var ref = db.ref("/");

	// if key not exist, it is null
	var boardUrl = databaseURL + "/board.json";
	var boardIdUrl = databaseURL + "/boardId.json";

	module.exports.saveBoard = function (boardId, boardData) {
		var boardRef = ref.child("board/" + boardId);
		boardRef.set( boardData );
	};

	module.exports.getBoards = function( callbackFunc ) {
		request( boardUrl, function (error, response, body) {
			callbackFunc( JSON.parse(body) );
		});
	}
}());