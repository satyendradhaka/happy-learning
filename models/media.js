var mongoose = require("mongoose");
let Schema = mongoose.Schema

let mediaSchema = new Schema({
	
	title: { type: String },
	filePath1: { type: String }, //720p
	filePath2: { type: String }, //480p
	filePath3: { type: String }, //360p

	course: { type: mongoose.ObjectId, ref: 'Course' },
	//subtopic: { type: String, required: true},
	viewcount: { type: Number, default: 0 }
})

module.exports = mongoose.model("Media", mediaSchema);
