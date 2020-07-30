var mongoose=require("mongoose");
let Schema= mongoose.Schema
const passportLocalMongoose = require("passport-local-mongoose");
let bookmarkSchema=new Schema({
	video:{type:mongoose.ObjectId, ref:'Media'},
	timestamp:{type:String},
	text:{type:String},
})

let courseSchema=new Schema({
	course:{type:mongoose.ObjectId, ref:'Course'},
	completed_videos:[{type:mongoose.ObjectId, ref:'Media'}],
	last_view: new Schema({
		video:{type:mongoose.ObjectId, ref:'Media'},
		timestamp:{type:String}

	}),
	Bookmarks:[bookmarkSchema]
})

let userSchema= new Schema({
	username: {type: String, unique: true},
    name: String,
	password:  String,
	passwordResetToken: String,
	passwordResetExpires: Date,
	isAdmin: {type: Boolean, default: false},
	isverified:{type: Boolean, default: false},
	enrolled_courses:[courseSchema],
},{
	versionKey: false // set to false then it wont create in mongodb
})

// userSchema.methods.validPassword = function (password) {
// 	console.log(password)
// 	console.log(this.password)
// 	if (password === this.password) {
// 	  return true; 
// 	} else {
// 	  return false;
// 	}
//   }
  userSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model("User", userSchema);