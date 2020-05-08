var express  = require("express"),
    router   = express.Router(),
    Media    = require("../models/media"),
    //Bookmark =require("../models/bookmark"),
    fs       = require('fs'),
    passport = require('passport');

router.get('/profile', isLoggedIn,function(req, res){
    res.render("profile", {user: req.user});
  });

router.get('/', function(req, res){
    Media.find({}, function(err, media){
		if(err){
			console.log(err);
		}else{
			res.render('home', {media:media})
		}
	})
});

//auth routes
//login route
router.get('/login', function(req, res){
    res.render('login');
  });
  
  //login route for through outlook
  router.get('/auth/outlook',
    passport.authenticate('windowslive', {
      scope: [
        'openid',
        'profile',
        'offline_access',
        'https://outlook.office.com/Mail.Read'
      ]
    })
  );
  //login callback route
  router.get('/auth/outlook/callback', 
    passport.authenticate('windowslive', { failureRedirect: '/' }),
    function(req, res) {
      // Successful authentication, redirect home.
      console.log(req.user);
      res.redirect('/');
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