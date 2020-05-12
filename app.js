const express             = require('express'),
      app                 = express(),
      passport            = require('passport'),
      mongoose            = require('mongoose'),
      OutlookStrategy     = require('passport-outlook'),
      bodyParser          = require("body-parser"),
      fs                  = require('fs'),
      session             = require('express-session'),
      MongoDBStore        = require('connect-mongodb-session')(session),
      User                = require("./models/user"),
      Media               = require("./models/media"),
      methodOverride		  = require("method-override"),
      multer              = require('multer'),
      Course              = require("./models/course"),
      PORT                = process.env.PORT || 3000,
      url                 = process.env.url || 'mongodb://localhost/SWC_Media';
//multer setup
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, './assets');
   },
  filename: function (req, file, cb) {
      cb(null , file.originalname);
  }
});
var upload = multer({ storage: storage })
//setup for production enviroment
var store = new MongoDBStore({
  uri: url,
  collection: 'mySessions'
});


app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));

var streamRoutes    = require("./routes/streaming"),
    indexRoutes     = require("./routes/index"),
    testingRoutes   =require('./routes/testing');
    adminRoutes     = require("./routes/adminRoutes");

//mongoose setup
//mongoose.connect("mongodb://localhost/SWC_Media" , {useUnifiedTopology: true ,useNewUrlParser: true,useFindAndModify: false});
mongoose.connect(url, {useUnifiedTopology: true ,useNewUrlParser: true,useFindAndModify: false});

//adding sample video
// Media.create({name:"sample2", path:"assets/sample2.mp4"}, function(err, media){
// 	if(err){
// 		console.log(err);
// 	}else{
// 		console.log("NEW MEDIA CREATED!")
// 		console.log(media);
// 	}
// })

// Media.create({title:"sample5", filePath:"assets/sample5.mp4"}, function(err, media){
// 	if(err){
// 		console.log(err);
// 	}else{
//     Course.findOne({title:"Python"}, function(err, foundCourse){
//         if(err){
//           console.log(err);
//         }else{
//           media.course=foundCourse
//           media.save()
//           console.log(media)
//         }
//       })
//     }
// })

// Course.create({title:"WebD"}, function(err, course){
//   if(err){
//     console.log(err)
//   }else{
//     console.log("COURSE ADDED!")
//     console.log(course);
//   }
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
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: process.env.callbackURL
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

//Setup routes
app.use("/", indexRoutes);
app.use("/courses/:id/", streamRoutes);
app.use('/',testingRoutes);
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
