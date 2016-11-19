module.exports = {
    Comment: function(authorClientId, message, xPos, yPos) {
        this.authorClientId = authorClientId;
        this.message = message;
        this.xPos = xPos;       // type: int
        this.yPos = yPos;       // type: int
    }
}
