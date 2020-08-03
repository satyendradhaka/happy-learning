let express = require("express");
let router = express.Router();
let Course = require("../models/course");
let Media = require("../models/media");
let User = require("../models/user");


//home page route for admin
router.get("/", isAdmin, function (req, res) {
  res.render("./admin/home");
});

//view all courses
router.get("/courses", isAdmin, function (req, res) {
  //get courses from db
  Course.find({}, function (err, allCourses) {
    if (err) {
      console.log(err);
    } else {
      res.render("./admin/courses/index", { courses: allCourses });
    }
  });
});

//add a new courses form render
router.get("/courses/add", isAdmin, function (req, res) {
  res.render("./admin/courses/new");
});

//logic to handel adding new course
router.post("/courses", isAdmin, function (req, res) {
  //data from form
  var title = req.body.title;
  var author = req.body.author;
  var newCourse = { title: title, author: author };
  Course.create(newCourse, function (err, newlyCreated) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/admin/courses");
    }
  });
});

//view a specifc course
router.get("/courses/:id", isAdmin, function (req, res) {
  Course.findById(req.params.id, function (err, foundCourse) {
    if (err) {
      res.redirect("/admin/courses");
    } else {
      console.log(foundCourse);
      res.render("./admin/courses/show", { course: foundCourse });
    }
  });
});

//add a new video to the course
//form to add a new video
router.get("/courses/:id/video/add", isAdmin, function (req, res) {
  Course.findById(req.params.id, function (err, foundCourse) {
    if (err) {
      res.redirect("/admin/courses");
    } else {
      res.render("./admin/courses/videos/add", { course: foundCourse });
    }
  });
});





// //logic for handeling adding of new video
// router.post("/courses/:id", isAdmin, function (req, res, next) {
//   upload(req, res, function (err) {
//     if (err) {
//       console.log(err);
//     } else {
//       Course.findById(req.params.id, function (err, foundCourse) {
//         if (err) throw err;

//         let media = {
//           title: req.body.title,
//           filePath1: req.files["v720"][0].destination + "/" + req.files["v720"][0].originalname,
//           filePath2: req.files["v480"][0].destination + "/" + req.files["v480"][0].originalname,
//           filePath3: req.files["v360"][0].destination + "/" + req.files["v360"][0].originalname,
//         };


//         Media.create(media, function (err, newlyCreated) {
//           if (err) {
//             console.log(err);
//           } else {
//             //add course id to media
//             newlyCreated.course = req.params.id;
//             //save media
//             newlyCreated.save();
//             foundCourse.videos.push(newlyCreated);
//             foundCourse.save();
//             res.redirect("/admin/courses/" + req.params.id);
//           }
//         });
//       });
//     }
//   });
// });

//edit course
//route for edit course form
router.get("/courses/:id/edit", isAdmin, function (req, res) {
  Course.findById(req.params.id, function (err, foundCourse) {
    res.render("./admin/courses/edit", { course: foundCourse });
  });
});
//update course
router.put("/courses/:id", isAdmin, function (req, res) {
  Course.findByIdAndUpdate(req.params.id, req.body.course, function (
    err,
    updatedCourse
  ) {
    if (err) {
      res.redirect("/");
    } else {
      res.redirect("/admin/courses");
    }
  });
});

//view all users
router.get("/users", isAdmin, async (req, res, next) => {
  try {
    let users = await User.find();
    if (users.length) {
      res.send(users);
    } else {
      error = {
        status: 400,
        message: "No users found",
      };
      throw error;
    }
  } catch (err) {
    next(err);
  }
});

//edit user permissions
//route for edit user form
router.get("/users/:id/edit", isAdmin, function (req, res) {
  User.findById(req.params.id, function (err, foundUser) {
    res.render("./admin/users/edit", { user: foundUser });
  });
});
//update user permissions
router.put("/users/:id", isAdmin, function (req, res) {
  User.findByIdAndUpdate(req.params.id, req.body.user, function (
    err,
    updatedUser
  ) {
    if (err) {
      res.redirect("/");
    } else {
      res.redirect("/admin/users");
    }
  });
});

//middleware
function isAdmin(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.isAdmin) {
      return next();
    }
  }
  res.redirect("/");
}

module.exports = router;
