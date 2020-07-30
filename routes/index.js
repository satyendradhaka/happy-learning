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
          user: process.env.GmailUser ,
          pass:process.env.GmailPassword ,
        }
      });
     var mailOptions = { from: process.env.GmailUser , to: user.username, subject: 'Account Verification Token from testotp', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/register\/confirmation\/' + token.token + '.\n'};
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
        user: process.env.GmailUser ,
        pass:process.env.GmailPassword ,
      }
    });
    var mailOptions = { from: process.env.GmailUser , to: req.user.username, subject: 'Account Verification Token from testotp', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/register\/confirmation\/' + token.token + '.\n'};
    transporter.sendMail(mailOptions, function (err) {
        if (err) { return res.status(500).send({ msg: err.message }); }
        res.send("an email has been sent to verify your email address")
    });

})

//middleware
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
      return next();
    }
    res.redirect("/login");
}

    module.exports=router;