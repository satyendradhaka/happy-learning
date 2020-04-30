var mongoose=require("mongoose");

var UserSchema = new mongoose.Schema({
    outlookId: String,
    name: String,
    email: String,
    accessToken:  String
})

module.exports=mongoose.model("User", UserSchema);