var mongoose = require("mongoose");
let Schema = mongoose.Schema

let mediaSchema = new Schema({

	title: { type: String },
	filePath: { type: String },
	course: { type: mongoose.ObjectId, ref: 'Course' },
	thumbnail: { type: String },
	//subtopic: { type: String, required: true},
	viewcount: { type: Number, default: 0 },
	duration: { type: Number }
})

module.exports = mongoose.model("Media", mediaSchema);
