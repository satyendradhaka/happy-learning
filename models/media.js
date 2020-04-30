var mongoose=require("mongoose");

var mediaSchema=new mongoose.Schema({
	name:String,
    path:String,
    bookmarks:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Bookmark"
    }]
});

module.exports=mongoose.model("Media", mediaSchema);