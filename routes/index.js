const dotenv = require('dotenv').config()
var express = require("express"),
  router = express.Router(),
  Media = require("../models/media"),
  User = require("../models/user"),
  Token = require("../models/token"),
  fs = require('fs'),
  nodemailer = require('nodemailer'),
  crypto = require('crypto'),
  Course = require("../models/course"),
  passport = require('passport');

router.get('/profile', isLoggedIn, async (req, res) => {
  enrolled = req.user.enrolled_courses
  courses = await Course.find()
  User.findById(req.user._id).populate("enrolled_courses_id").exec(function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      console.log(foundUser.enrolled_courses_id)
      console.log(foundUser)
      res.render("profile", { user: foundUser });
    }
  });
});

router.get('/', function (req, res) {
  res.render('home')
});

//auth routes
//register routes

router.post("/register", function (req, res) {
  if (!req.body.username.includes("@iitg.ac.in")) {
    console.log("enter your outlook id")
    req.flash("error", "use your iitg outlook id")
    return res.redirect("/")
  }
  if(req.body.password.length<8){
    console.log("password must be of minimum 8 length")
    req.flash("error", "Password must be of 8 lengths")
    res.redirect("/")
  }
  var newUser = new User({ username: req.body.username, name: req.body.name })
  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      console.log(err)
			req.flash("error", err.message);
			return res.redirect("/");
    }
    var token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
    token.save(function (err) {
      if (err) {
        console.log(err)
        req.flash("error", "otp generation failed, please login and try again")
        return res.send("token not saved")
      }
    })
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: process.env.GmailUser,
        pass: process.env.GmailPassword,
        pass: process.env.GmailPassword,
      }
    });
    var mailOptions = { from: process.env.GmailUser, to: user.username, subject: 'Account Verification Token from testotp', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/register\/confirmation\/' + token.token + '.\n' };
    transporter.sendMail(mailOptions, function (err) {
      if (err) { 
        req.flash("error", "verification email not send, if the error is persistance please contact SWC")
        res.redirect("/")
       }
      req.flash("success", "verification email sent, please check your inbox and junk mails too")
      res.redirect("/")
    });
  })
})


router.get('/register/confirmation/:id', function (req, res) {
  Token.findOne({ token: req.params.id }, function (err, token) {
    if (!token) {
      console.log("token not found")
      req.flash("error", "link expired, please try again")
      res.redirect("/")
    }
    User.findOne({ _id: token._userId }, function (err, user) {
      if (!user) {
        console.log("user not found for this token")
        req.flash("error", "invalid link, no user registered")
        res.redirect("/")
      }
      if (user.isverfied) {
        console.log("user already verified")
        req.flash("success", "user verified succesfully, please login and enjoy the courses")
        res.redirect("/")
      }

      user.isverified = true
      Token.deleteOne({ token: req.body.token })
      user.save(function (err) {
        if (err) {
          console.log(err)
          res.redirect("/")
        }
        console.log("user verified")
        res.redirect('/')
      })
    })
  })
})

//login route
router.post("/login", passport.authenticate("local",
  {
    failureRedirect: '/',
    failureFlash: true
  }), function (req, res) {
    if (req.user.isverified) {
      req.flash("success", "welcome to happy learning")
      res.redirect('/profile')
    }
    else {
      console.log("inside not verified")
      req.flash("error", "user not verified")
      res.redirect('/register/resetToken')
    }
  });
//logout route
router.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    req.logOut();
    req.flash("success", "logged out successfully")
    res.redirect('/');
  });
});


router.get("/register/resetToken", function (req, res) {
  if (!req.isAuthenticated()) {
    req.flash("error", "please login first")
    res.redirect('/')
  }
  if(req.user.isverified){
    req.flash("error", "user already verified")
  }
  var token = new Token({ _userId: req.user._id, token: crypto.randomBytes(16).toString('hex') });
  token.save(function (err) {
    if (err) {
      console.log(err)
      req.flash("error", "verification link not generated")
      return res.redirect("/")
    }
  });
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
      user: process.env.GmailUser,
      pass: process.env.GmailPassword,
    }
  });
  var mailOptions = { from: process.env.GmailUser, to: req.user.username, subject: 'Account Verification Token from testotp', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/register\/confirmation\/' + token.token + '.\n' };
  transporter.sendMail(mailOptions, function (err) {
    if (err) { 
      req.flash("error", "verification email not sent please try again if error is perisistance contact SWC")
      req.session.destroy(function (err) {
        req.logOut();
        res.redirect('/');
      });
     }
     req.flash("success", "an email has been sent to verify email address, please check your inbox, if not in inbox then in junk box")
     req.session.destroy(function (err) {
      req.logOut();
      res.redirect('/');
    });
  });

})

router.get("/login/forgot", function (req, res) {
  res.render("forgot")
})

router.post("/login/forgot", function (req, res) {
  User.findOne({ username: req.body.username }, function (err, user) {
    if (!user) {
      console.log("user not found")
      res.redirect('/login/forgot')
    }
    user.passwordResetToken = crypto.randomBytes(16).toString('hex')
    user.passwordResetExpires = Date.now() + 3600000
    user.save(function (err) {
      if (err) {
        console.log(err)
      }
    })
    console.log(user)
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: process.env.GmailUser,
        pass: process.env.GmailPassword,
      }
    });
    var mailOptions = { from: process.env.GmailUser, to: user.username, subject: 'Password reset request for your account on happylearning', text: 'Hello,\n\n' + 'Please reset your account password by clicking the link: \nhttp:\/\/' + req.headers.host + '\/login\/forgot\/confirmation\/' + user.passwordResetToken + '.\n' };
    transporter.sendMail(mailOptions, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); }
      res.send("an email has been sent to your registered email address with further instructions, please check your junk folder also")
    });
  })
})

router.get("/login/forgot/confirmation/:id", function (req, res) {
  User.findOne({ passwordResetToken: req.params.id, passwordResetExpires: { $gt: Date.now() } }, function (err, user) {
    if (!user) {
      console.log("user not found, reset password token expired on invalid")
      return res.redirect("/");
    }
    res.render("reset", { resetToken: req.params.id });
  })
})

router.post("/login/forgot/reset/:id", function (req, res) {
  User.findOne({ passwordResetToken: req.params.id, passwordResetExpires: { $gt: Date.now() } }, function (err, user) {
    if (!user) {
      console.log("no user found, please try again")
      return res.redirect("/login/forgot");
    }
    if (req.body.newPassword == req.body.confirmPassword) {
      user.setPassword(req.body.newPassword, function (err) {
        if (err) {
          console.log(err)
          return res.redirect('/login/forgot')
        }
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        user.save(function (err) {
          req.logIn(user, function (err) {
            console.log("password reset and logged in")
          })
        })
      })
    }
    else {
      console.log("password don't match")
      return res.redirect("back")
    }
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: process.env.GmailUser,
        pass: process.env.GmailPassword,
      }
    });
    var mailOptions = { from: process.env.GmailUser, to: user.username, subject: 'Password reset for your account on happylearning', text: 'Hello,\n\n' + 'password for your account on happylearing has been changed on' + Date.now() + '\n If it was not you please contact swc IITG for recovery of your account as soon as possible \n' };
    transporter.sendMail(mailOptions, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); }
      res.redirect('/')
    });
  })
})

router.get("/developers", function (req, res) {
  res.render('developers')
})

//middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated() & req.user.isverified) {
    return next();
  }
  res.redirect("/");
}

module.exports = router;
