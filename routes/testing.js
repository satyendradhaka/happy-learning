let express=require('express')
let router=express.Router()

let Course=require("../models/course")
let Media=require("../models/media")
let User=require("../models/user")

//create a new course
// router.get('/course', async (req,res)=>{
//   try{
//     let course= await new Course({
//       title:'kiken',
//       topics:['Psych','Deep Learning']
//     })
//     let data=await course.save()
//     res.send(data)
//   }
//   catch(err){
//     console.log(err)
//     res.status(500).send("some error happened")
//   }
// })

//create a new video
// router.get('/media', async (req,res)=>{
//   try{
//     let course=await Course.findOne({title:'shiken'})
//     let media= await new Media({
//       title:'introduction',
//       filePath:'nulll',
//       course:course._id
//     })
//     let data=await media.save()
//     res.send(data)
//   }
//   catch(err){
//     console.log(err)
//     res.status(500).send("some error happened")
//   }

// })

//create a new user, not really needed
// router.get('/user', async (req,res)=>{
//   try{
//     let video = await Media.findOne({title:'introduction'})
//     let courseData={
//       course:video.course,
//       last_view:{
//         video:video._id,
//         timestamp:123.33
//       }
//     }
//     let user=await new User({
//       outlookId:"null",
//       name:"vlad Dracula",
//       email:"kezluk_bey@imp.turk",
//       accessToken:'nulll',
//       enrolled_courses:[courseData]
//     })
//     let data= await user.save()
//     res.send(data)
//   }
//   catch(err){
//     console.log(err)
//     res.status(500).send("some error happened")
//   }
// })

// //list all users
// router.get('/user/all', async(req,res,next)=>{
//   try{
//     let users=await User.find()
//     if(users.length){
//       res.send(users)
//     }
//     else{
//       error={
//         'status':400,
//         'message':"No users found"
//       }
//       throw error
//     }
//   }
//   catch(err){
//     next(err)
//   }
// })

//list all courses
router.get('/courses', async(req,res,next)=>{
  try{
    let courses=await Course.find()
    if(courses.length){
      res.render("allCourses", {courses:courses})
    }
    else{
      //no courses found
      error={
        status:404,
        message:'No courses found'
      }
      throw error
    }
  }
  catch(err){
    next(err)
  }
})

//course page
router.get('/courses/:id', async(req,res,next)=>{
  try{
    if(!req.user){
      //the user is not signed in
      let course=await Course.findOne({'_id':req.params.id})
      if(course){
        //the course exists
        res.redirect("/")
      }
      else{
        //the course does not exist
        error={
          'status':400,
          'message':'Course not found'
        }
        throw error
      }
    }
    else{
      //if the user is signed in
      let getcourse= Course.findOne({'_id':req.params.id})
      let getuser= User.findOne({'_id':req.user._id,'enrolled_courses.course':req.params.id})
      //run the queries parallely and wait for their results
      let [user,course]=await Promise.all([getuser,getcourse])
      let isEnrolled=false

      if(course){
        //the course exists
        if(user){
          //the user is already enrolled
          isEnrolled=true
        }
        if(isEnrolled){
          var selected;
          await user.enrolled_courses.forEach(function(courseData){
            if(courseData.course.equals(course._id)){
              selected=course;
            }
          })

          //console.log(selected);

          Media.find({course:selected}, function(err, media){
            if(err){console.log(err)}
            else{
              res.render("course", {media:media, course_id:req.params.id})

              //console.log(media)
            }
          })

        }else{
          res.render("enrol", {course:course})
        }
        
      }
      else{
        //the course does not exist
        error={
          'status':400,
          'message':'Course not found'
        }
        throw error
      }
    }
  }
  catch(err){
    next(err)
  }
})

//course enrol
router.get('/courses/:id/enrol', async (req,res,next)=>{
  try{
    if(!req.user){
      //user is not signed in
      error={
        'status':401,
        'message':'Unauthorized, please login to enrol'
      }
      throw error
    }

    //user is signed in
    let getcourse= Course.findOne({'_id':req.params.id})
    let getuser = User.findOne({'_id':req.user._id})

    let [user,course]=await Promise.all([getuser,getcourse])
    //run the queries parallely and wait for their results

    if(course){
      //the course id is valid
      user.enrolled_courses.push({
        'course': course._id
      })
      user.enrolled_courses_id.push(course._id)
      updated= await user.save()
      res.redirect("/courses/"+course._id)
    }
    else{
      //if the id doesn't belong to an existing course
      error={
        'status':404,
        'message':"No such course found"
      }
      throw error
    }
  }
  catch(err){
    next(err)
  }
})


module.exports=router
