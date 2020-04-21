var express = require("express");

var app = express();

app.get("/", function(req, res){
	res.send("hello page! This is swc Website for courses");
});

app.listen(3000, function(){
	console.log("server has started");
})