var mongoose = require("mongoose");
 
var bookmarkSchema = new mongoose.Schema({
    text: String,
    time: String
});
 
module.exports = mongoose.model("Bookmark", bookmarkSchema);