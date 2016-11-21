module.exports = {
    StrokeId: function(authorClientId, authorStrokeId) {
        this.authorClientId = authorClientId;
        this.authorStrokeId = authorStrokeId; // stroke id, unique for an author/client
                                        // i.e. stroke id 1 of client 0 and stroke id 1 of client 1 are different
    },

    // represents a stroke of drawing (from mouse down to mouse up); might be an eraser stroke
    StrokeData: function(colorId = 0, isEraserStroke = false) {
        this.colorId = colorId;
        this.isEraserStroke = isEraserStroke; // if true, represents that the stroke is eraser sized
        this.dataPoints = new Array();  // array where each element represents data about a drawn point
    }
}
