let mongoose=require("mongoose");
let Schema= mongoose.Schema;

let courseSchema=new Schema({
	course:{type:mongoose.ObjectId, ref:'Course'},

	videos:[{type:mongoose.ObjectId, ref:'Media'}],

	last_view: new Schema({
		video:{type:mongoose.ObjectId, ref:'Media'},
		timestamp:{type:Number}
	}),
	
	bookmarks:{type:mongoose.ObjectId, ref:'Bookmark'}
})

module.exports=mongoose.model("CourseData", courseSchema);