let mongoose = require('mongoose')
let Schema = mongoose.Schema

let courseSchema = new Schema({
	title: { type: String, required: true },
	author: {type: String, required: true},
	topics: [String],
	description: String,
	videos: [{ type: mongoose.ObjectId, ref: 'Media' }]
})

module.exports = mongoose.model("Course", courseSchema)
