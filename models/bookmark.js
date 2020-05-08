let mongoose=require("mongoose");
let Schema= mongoose.Schema

let bookmarkSchema=new Schema({
	video:{type:mongoose.ObjectId, ref:'Media'},
	timestamp:{type:Number},
	text:{type:String},
})

module.exports=mongoose.model("Bookmark", bookmarkSchema);