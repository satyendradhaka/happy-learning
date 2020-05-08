var express  = require("express"),
    router   = express.Router(),
    Media    = require("../models/media"),
    //Bookmark =require("../models/bookmark"),
    fs       = require('fs');

router.get("/video/:id", function(req, res){
	//find the campground with given id
	Media.findById(req.params.id).populate("bookmarks").exec(function(err, foundVideo){
		if(err){
			console.log(err)
		}else{
			res.render("video", {video:foundVideo});
		}
	});
	
	
});

router.get('/video/watch/:id',async (req,res)=>{

	Media.findById(req.params.id, function(err, foundMedia){
		if(err){
			console.log(err)
		}else{
			const path=foundMedia.path;
			
			try{
				fs.stat(path,(err,stat)=>{
					if(err){throw err}
					const fileSize=stat.size
					const range=req.headers.range
					//console.log(range)
					if(range){
						const parts=range.replace(/bytes=/,"").split('-')
						const start=parseInt(parts[0],10)
						const end=parts[1]?
							parseInt(parts[1],10)
							:fileSize-1
						const chunksize=(end-start)+1
						const file=fs.createReadStream(path,{start,end})
						res.writeHead(206,{
							'Content-Range':`bytes ${start}-${end}/${fileSize}`,
							'Accept-Ranges':'bytes',
							'Content-Length':chunksize,
							'Content-Type':'video/mp4'
						})
						file.pipe(res)
					}
					else{
						res.writeHead(200,{
							'Content-Length':fileSize,
							'Content-Type':'video/mp4'
						})
						fs.createReadStream(path).pipe(res)
					}
		
				})
			}
			catch(err){
				console.log(err)
			}
		}
	})
})

router.post("/video/:id", function(req, res){
	Media.findById(req.params.id, function(err, video){
		if(err){
			console.log(err);
			redirect("/video")
		}else{
			//console.log(req.body.bookmark);
			Bookmark.create(req.body.bookmark, function(err, bookmark){
				if(err){
					console.log(err)
				}else{
					video.bookmarks.push(bookmark);
					video.save();
					res.json(bookmark);
				}
			})
		}
	})
	
})

module.exports = router;