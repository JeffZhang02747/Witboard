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
	var ref = db.ref("/server/saving-data/fireblog");
	var refUrl = databaseURL + "/server/saving-data/fireblog";


	module.exports.insertBoardData = function (boardId, boardData) {
		var boardRef = ref.child("board/" + boardId); 
		boardRef.set( boardData );
	};

	// blocking function
	module.exports.getBoardData = function ( boardId, callbackFunc ) {
		var boardRefUrl = refUrl + "/board/" + boardId + ".json";

		request( boardRefUrl, function (error, response, body) {

			callbackFunc( JSON.parse(body) );
		});
	};

	module.exports.saveBoardId = function (val) {
		var boardRef = ref.child("boardId"); 
		boardRef.set( val );
	}

	module.exports.getBoardId = function ( callbackFunc ) {
		var idUrl = refUrl + "/boardId.json";

		request( idUrl, function (error, response, body) {
			callbackFunc( JSON.parse(body) );
		});
	}

	module.exports.saveUserId = function (val) {
		var boardRef = ref.child("userId");
		boardRef.set( val );
	}

	module.exports.getUserId = function( callbackFunc ) {
		var idUrl = refUrl + "/userId.json";

		request( idUrl, function (error, response, body) {
			callbackFunc( JSON.parse(body) );
		});
	}

	// module.exports.getUserId = function () {

	// }
	
}());