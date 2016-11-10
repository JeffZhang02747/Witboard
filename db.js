(function() {

	var admin = require("firebase-admin");
	var keyLoc = "witboardKey.json";

	admin.initializeApp({
	    credential: admin.credential.cert(keyLoc),
	    databaseURL: "https://witboard-6b200.firebaseio.com"
	});

	var db = admin.database();
	var ref = db.ref("server/saving-data/fireblog");

	module.exports.insertBoardData = function (boardId, boardData) {
		var boardRef = ref.child("board/" + boardId); 
		boardRef.set( boardData );
	};

	// blocking function
	module.exports.getBoardData = function ( boardId ) {
		var boardRef = ref.child("board/" + boardId);

		var ret = null;

		boardRef.once("value", function(data) {
			ret = data.val();
		});

		// blocking until retrieve data
		while ( ret == null ){
			continue;
		}
		return ret
	};

	// module.exports.getBoardId = function () {

	// }

	// module.exports.getUserId = function () {

	// }
	
}());