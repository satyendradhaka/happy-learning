const express             = require('express'),
      app                 = express(),
      passport            = require('passport'),
      mongoose            = require('mongoose'),
      OutlookStrategy     = require('passport-outlook'),
      bodyParser          = require("body-parser"),
      fs                  = require('fs'),
      User                = require("./models/user"),
      Media               = require("./models/media"),
      methodOverride		  = require("method-override"),
      PORT                = process.env.PORT || 3000,
      url                 = process.env.url || 'mongodb://localhost/SWC_Media'
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));

var streamRoutes    = require("./routes/streaming"),
    indexRoutes     = require("./routes/index"),
    adminRoutes     = require("./routes/adminRoutes");

//mongoose setup
mongoose.connect("mongodb://localhost/SWC_Media" , {useUnifiedTopology: true ,useNewUrlParser: true,useFindAndModify: false});
// mongoose.connect("mongodb+srv://satyendra:1234@cluster0-afmf0.mongodb.net/test?retryWrites=true&w=majority" , {useUnifiedTopology: true ,useNewUrlParser: true,useFindAndModify: false});

//adding sample video
// Media.create({name:"sample2", path:"assets/sample2.mp4"}, function(err, media){
// 	if(err){
// 		console.log(err);
// 	}else{
// 		console.log("NEW MEDIA CREATED!")
// 		console.log(media);
// 	}
// })


//passport configuration
app.use(require("express-session")({
	secret: "once again pkmb",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err,user)
    });
});
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	next();
});
passport.use(new OutlookStrategy({
    clientID: 'fa92e2c7-c19c-42ae-a994-990d670491ad',
    clientSecret: 'G[z/HfAhhG77.38NjEsi-=XK8mYu7nlh',
    callbackURL: 'http://localhost:3000/auth/outlook/callback'
  },
  function(accessToken, refreshToken, params,profile, done) {
    User.findOne({
        outlookId: profile.id
    }, function(err, user){
        if(err){
            done(err);
        }
        //if no user was found then create one
        if(!user){
          var str = profile._json.EmailAddress;
          var n = str.search('@iitg.ac.in');
          if(n!=-1){
            user = new User({
                outlookId: profile._json.Id,
                name: profile._json.DisplayName,
                email: profile._json.EmailAddress,
                accessToken:  accessToken
            });
            user.save(function(err){
                if(err) console.log(err);
                return done(err, user);
            });
          }
        }else{
            return done(err, user);
        }
    });
  }
));




app.use("/", indexRoutes);
app.use("/", streamRoutes);
app.use("/admin", adminRoutes);




//Error handler
app.use((err,req,res,next)=>{
  res.status(err.status||500)
  res.  send(err.status?err:{"message":"Internal server error, check server log"})
  if(!err.status){
    console.log(err)
  }
})


//middleware
function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/login");
}
function isAdmin(req, res, next){
  if(req.isAuthenticated()){
    if(req.user.isAdmin){
      return next();
    }
  }
  res.redirect("/");
}


app.listen(PORT, function(){
    console.log("SWC Media server has started");
});
