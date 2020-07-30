const user = require("../models/user");

var express  = require("express"),
    router   = express.Router(),
    Media    = require("../models/media"),
    User = require("../models/user"),
    Token = require("../models/token"),
    fs       = require('fs'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto'),
    passport = require('passport');

router.get('/profile', isLoggedIn,function(req, res){
    res.render("profile", {user: req.user});
  });

router.get('/', function(req, res){
			res.render('home')
});

//auth routes
//register routes
router.get("/register", function (req, res){
  if(req.isAuthenticated()){
    res.redirect("/")
  }
  res.render("register")
});

router.post("/register", function (req, res){
  if(!req.body.username.includes("@iitg.ac.in")){
    console.log("enter your outlook id")
    return res.redirect("/register")
  }
  var newUser = new User({username: req.body.username, name: req.body.name})
  User.register(newUser, req.body.password, function(err, user){
    if(err){
        console.log(err)
        res.redirect('/register');
    }
    var token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
    token.save(function(err){
        if(err){
            console.log(err)
            return res.send("token not saved")
        }
    })
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
          user: process.env.GmailUser || "happylearning151@gmail.com" ,
          pass:process.env.GmailPassword || "swciitg123" ,
        }
      });
     var mailOptions = { from: process.env.GmailUser || "happylearning151@gmail.com" , to: user.username, subject: 'Account Verification Token from testotp', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/register\/confirmation\/' + token.token + '.\n'};
    transporter.sendMail(mailOptions, function (err) {
        if (err) { return res.status(500).send({ msg: err.message }); }
        res.send("an email has been sent to verify your email address")
    });
})
})

router.get('/register/confirmation/:id', function (req, res){
  Token.findOne({token: req.params.id}, function (err, token){
    if(!token){
        console.log("token not found")
        res.send("not verified, token expired or incorrect token")
    }
    User.findOne({_id: token._userId}, function (err, user){
        if(!user){
            console.log("user not found for this token")
            res.redirect("/register")
        }
        if(user.isverfied){
            console.log("user already verified")
            res.redirect("/login")
        }

        user.isverified = true
        Token.deleteOne({token: req.body.token})
        user.save(function(err){
            if(err){
                console.log(err)
                res.redirect("/register")
            }
            console.log("user verified")
            res.redirect('/login')
        })
    })
})
})



//login route
router.get('/login', function(req, res){
    res.render('login');
  });
  
  //login route
  router.post("/login", passport.authenticate("local",
  {
    failureRedirect:'/login'
  }), function (req, res){
    if(req.user.isverified){
      res.redirect('/')
    }
    else {
            console.log("inside not verified")
            res.redirect('/register/resetToken')
        }
});
  //logout route
  router.get('/logout', function(req, res){
      req.session.destroy(function(err) {
        req.logOut();
        res.redirect('/');
      });
    });
 

router.get("/register/resetToken",function (req, res){
  if(!req.isAuthenticated()){
    res.redirect('/login')
  }
  var token = new Token({ _userId: req.user._id, token: crypto.randomBytes(16).toString('hex') });
    token.save(function(err){
        if(err){
            console.log(err)
            return res.send("token not saved")
        }
    });
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: process.env.GmailUser || "happylearning151@gmail.com" ,
        pass:process.env.GmailPassword || "swciitg123" ,
      }
    });
    var mailOptions = { from: process.env.GmailUser || "happylearning151@gmail.com" , to: req.user.username, subject: 'Account Verification Token from testotp', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/register\/confirmation\/' + token.token + '.\n'};
    transporter.sendMail(mailOptions, function (err) {
        if (err) { return res.status(500).send({ msg: err.message }); }
        res.send("an email has been sent to verify your email address")
    });

})

router.get("/login/forgot", function (req, res){
  res.render("forgot")
})

router.post("/login/forgot", function (req, res){
  User.findOne({username: req.body.username}, function (err, user){
    if(!user){
      console.log("user not found")
      res.redirect('/login/forgot')
    }
    user.passwordResetToken= crypto.randomBytes(16).toString('hex')
    user.passwordResetExpires= Date.now() + 3600000
    user.save(function (err){
      if (err){
        console.log(err)
      }
    })
    console.log(user)
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: process.env.GmailUser || "happylearning151@gmail.com" ,
        pass:process.env.GmailPassword || "swciitg123" ,
      }
    });
    var mailOptions = { from: process.env.GmailUser || "happylearning151@gmail.com" , to: user.username, subject: 'Password reset request for your account on happylearning', text: 'Hello,\n\n' + 'Please reset your account password by clicking the link: \nhttp:\/\/' + req.headers.host + '\/login\/forgot\/confirmation\/' + user.passwordResetToken + '.\n'};
    transporter.sendMail(mailOptions, function (err) {
        if (err) { return res.status(500).send({ msg: err.message }); }
        res.send("an email has been sent to your registered email address with further instructions")
    });
  })
})

router.get("/login/forgot/confirmation/:id", function (req, res){
  User.findOne({passwordResetToken: req.params.id, passwordResetExpires: {$gt: Date.now()}}, function (err, user){
    if(!user){
      console.log("user not found, reset password token expired on invalid")
      return res.redirect("/login");
    }
    res.render("reset", {resetToken: req.params.id});
  })
})

router.post("/login/forgot/reset/:id", function (req, res){
  User.findOne({passwordResetToken: req.params.id, passwordResetExpires: {$gt: Date.now()}}, function (err, user){
    if(!user){
      console.log("no user found, please try again")
      return res.redirect("/login/forgot");
    }
    if(req.body.newPassword==req.body.confirmPassword){
        user.setPassword(req.body.newPassword, function (err){
          if(err){
            console.log(err)
            return res.redirect('/login/forgot')
          }
          user.passwordResetToken = undefined
          user.passwordResetExpires= undefined
          user.save(function(err){
            req.logIn(user, function(err){
              console.log("password reset and logged in")
            })
          })
        })
    }
    else{
      console.log("password don't match")
      return res.redirect("back")
    }
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: process.env.GmailUser || "happylearning151@gmail.com" ,
        pass:process.env.GmailPassword || "swciitg123" ,
      }
    });
    var mailOptions = { from: process.env.GmailUser || "happylearning151@gmail.com" , to: user.username, subject: 'Password reset for your account on happylearning', text: 'Hello,\n\n' +'password for your account on happylearing has been changed on' + Date.now() +'\n If it was not you please contact swc IITG for recovery of your account as soon as possible \n'};
    transporter.sendMail(mailOptions, function (err) {
        if (err) { return res.status(500).send({ msg: err.message }); }
            res.redirect('/')
      });
  })
})

//middleware
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
      return next();
    }
    res.redirect("/login");
}

module.exports=router;