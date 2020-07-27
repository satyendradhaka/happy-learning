var express  = require("express"),
    router   = express.Router(),
    Media    = require("../models/media"),
    User = require("../models/user"),
    OTP = require("../models/OTP"),
    fs       = require('fs'),
    nodemailer = require('nodemailer'),
    otpGenerator = require('otp-generator'),
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
  if(!req.body.outlookId.includes("@iitg.ac.in")){
    console.log("enter your outlook id")
    res.redirect("/register")
  }
  var newUser = new User({outlookId: req.body.outlookId, username: req.body.username})
  User.register(newUser, req.body.password, function(err, user){
    if(err){
        console.log(err)
        res.redirect('/register');
    }
    var otp = new OTP({ _userId: user._id, OTP: otpGenerator.generate(6, { alphabets: false, specialChars: false }) });
    otp.save(function(err){
        if(err){
            console.log(err)
            return res.send("token not saved")
        }
    })
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
          user: process.env.GmailUser,
          pass:process.env.GmailPassword,
        }
      });
     var mailOptions = { from: process.env.GmailUser, to: user.outlookId, subject: 'Account Verification Token from testotp', text: 'Hello,\n\n' + 'Please verify your account by entering the token: \n' + otp.OTP + '\n' };
    transporter.sendMail(mailOptions, function (err) {
        if (err) { return res.status(500).send({ msg: err.message }); }
        res.redirect('/otp')
    });
})
})

router.get('/otp', function (req, res){
  res.render('otp')
})

router.post('/confirmation', function (req, res){
  OTP.findOne({OTP: req.body.otp}, function (err, otp){
    if(!otp){
        console.log("otp not found")
        res.send("not verified otp expired or incorrect otp")
    }
    User.findOne({_id: otp._userId}, function (err, user){
        if(!user){
            console.log("user not found for this token")
            res.redirect("/register")
        }
        if(user.isverfied){
            console.log("user already verified")
            res.redirect("/login")
        }

        user.isverified = true
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
    successRedirect:"/",
    failureRedirect:'/login'
  }), function (req, res){
});
  //logout route
  router.get('/logout', function(req, res){
      req.session.destroy(function(err) {
        req.logOut();
        res.redirect('/');
      });
    });
 
//middleware
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
      return next();
    }
    res.redirect("/login");
}

    module.exports=router;