var express  = require("express"),
	mongoose = require("mongoose"),
    router   = express.Router({mergeParams: true}),
	Media    = require("../models/media"),
	User     = require("../models/user"),
    fs       = require('fs');

router.get("/video/:video_id", async(req, res, next)=>{

	try{
		let getvideo= Media.findOne({'_id':req.params.video_id,'course':req.params.id})
		let getuser= User.findOne({'_id':req.user._id,'enrolled_courses.course':req.params.id})
		let [user,video]=await Promise.all([getuser,getvideo])

		if(user && video){
			let courseIndex=user.enrolled_courses.findIndex(courseItem=>{
				return courseItem.course==req.params.id
			  })

			  console.log(user.enrolled_courses[courseIndex])

			  //let foundVideo=Media.findById(req.params.video_id)
			  res.render("video", {video:video, course_id:req.params.id, bookmarks:user.enrolled_courses[courseIndex].Bookmarks})
		}
		else{
			error={'status':400,'message':'Course-video mismatch'}
			throw error;
		  }


	}catch(err){
		next(err);
	}
	
	
});

router.get('/video/watch/:video_id',async (req,res)=>{

	Media.findById(req.params.video_id, function(err, foundMedia){
		if(err){
			console.log(err)
		}else{
			const path=foundMedia.filePath;
			
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

router.post('/video/:video_id/', async (req,res,next)=>{
	//check authenticated
	//check course enrolled
	//check valid video
	try{
	  let getvideo= Media.findOne({'_id':req.params.video_id,'course':req.params.id})
	  let getuser= User.findOne({'_id':req.user._id,'enrolled_courses.course':req.params.id})
	  let [user,video]=await Promise.all([getuser,getvideo])
	  //debugger;
	  if(user && video){ 
		let courseIndex=user.enrolled_courses.findIndex(courseItem=>{
		  return courseItem.course==req.params.id
		})
		
		let newBookmark={
			'video':mongoose.Types.ObjectId(req.params.video_id),
			'timestamp':req.body.time,
			'text':req.body.text
		  }

		user.enrolled_courses[courseIndex].Bookmarks.push(newBookmark)
  
		let updated= await user.save()
		res.json(newBookmark)
	  }
	  else{
		error={'status':400,'message':'Course-video mismatch'}
		throw error
	  }
	}
	catch(err){
	  next(err)
	}
  })

module.exports = router;