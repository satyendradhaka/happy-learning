let express=require('express')
let router=express.Router()

let Course=require("../models/course")
let Media=require("../models/media")
let User=require("../models/user")
const { route } = require('./streaming')

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

//search implementation
router.get("/courses/search", function (req, res){
  Course.find({$or: [{author:{'$regex':req.query.dsearch}}, {title: {'$regex':req.query.dsearch}}, {topics:{'$regex':req.query.dsearch}}]}, function(err, foundCourses){
    if(err){
      console.log(err);
      return res.redirect('back')
    }
    res.render('search', {foundCourses: foundCourses})
  })
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
        if(user){isEnrolled=true}
        let userData={} //stores user-specific course details(like % completed etc)
        if(isEnrolled){
          await user.enrolled_courses.forEach(function(courseData){
            if(courseData.course.equals(course._id)){
              userData=course;
            }
          })
        }
        Media.find({course:course._id}, function(err, media){
          if(err){throw err}
          else{
            res.render("course", {isEnrolled:isEnrolled, media:media, course:course, userData:userData})
          }
        })
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
