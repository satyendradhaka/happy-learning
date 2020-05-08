let express=require('express')
let router=express.Router()

let Course=require("../models/course")
let Media=require("../models/media")
let User=require("../models/user")

//home page route for admin
router.get("/", isAdmin, function(req, res){
    res.render("./admin/home");
});

//view all courses
router.get('/courses', isAdmin,async(req,res,next)=>{
    try{
      let courses=await Course.find()
      if(courses.length){
        res.send(courses)
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

 

//add a new courses form render
router.get("/courses/add", isAdmin, function(req, res){
    res.render("./admin/courses/new");
});

//logic to handel adding new course
router.post("/courses", isAdmin, function(req, res){
    //data from form
    var title= req.body.title;
    var newCourse ={title: title};
    Course.create(newCourse, function(err, newlyCreated){
        if(err){
            console.log(err);
        }else{
            res.redirect("/admin/courses");
        }
    })
})

//edit course
//route for edit course form
router.get("/courses/:id/edit", isAdmin, function(req, res){
    Course.findById(req.params.id, function(err, foundCourse){
        res.render("./admin/courses/edit", {course: foundCourse});
    })
})
//update course
router.put("/courses/:id", isAdmin, function(req, res){
    Course.findByIdAndUpdate(req.params.id, req.body.course, function(err, updatedCourse){
        if(err){
            res.redirect("/");
        }else{
            res.redirect("/admin/courses");
        }
    })
})

//view all users
router.get('/users', isAdmin,async(req,res,next)=>{
    try{
      let users=await User.find()
      if(users.length){
        res.send(users)
      }
      else{
        error={
          'status':400,
          'message':"No users found"
        }
        throw error
      }
    }
    catch(err){
      next(err)
    }
  })

//edit user permissions
//route for edit user form
router.get("/users/:id/edit", isAdmin, function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        res.render("./admin/users/edit", {user: foundUser});
    })
})
//update user permissions
router.put("/users/:id", isAdmin, function(req, res){
    User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
        if(err){
            res.redirect("/");
        }else{
            res.redirect("/admin/users");
        }
    })
})

//middleware
function isAdmin(req, res, next){
    if(req.isAuthenticated()){
        if(req.user.isAdmin){
          return next();        
        }
    }
    res.redirect("/");
  }
  
  


module.exports = router;