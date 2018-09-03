mongoose = require("mongoose");

// Comment - text, author (user)
var commentSchema = mongoose.Schema({
    text: String,
    author: String
});

module.exports = mongoose.model("Comment", commentSchema);
