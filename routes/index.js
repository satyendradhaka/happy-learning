var express  = require("express"),
    router   = express.Router(),
    Media    = require("../models/media"),
    fs       = require('fs'),
    passport = require('passport');

router.get('/profile', isLoggedIn,function(req, res){
    res.render("profile", {user: req.user});
  });

router.get('/', function(req, res){
			res.render('home')
		
	
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
        'https://outlook.office.com/User.Read'
      ]
    })
  );
  //login callback route
  router.get('/auth/outlook/callback', 
    passport.authenticate('windowslive', { failureRedirect: '/' }),
    function(req, res) {
      // Successful authentication, redirect home.
      
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