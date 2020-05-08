var mongoose=require("mongoose");
let Schema=mongoose.Schema

let mediaSchema=new Schema({
	title:{type:String},
	filePath:{type:String},
	course:{type:mongoose.ObjectId,ref:'Course'},
	viewcount:{type:Number, default:0}
})

module.exports=mongoose.model("Media", mediaSchema);