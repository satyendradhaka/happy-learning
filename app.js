const express = require('express');
const app = express();
const passport = require('passport');
const mongoose = require('mongoose');
const OutlookStrategy = require('passport-outlook');
const bodyParser = require("body-parser");
const fs = require('fs');
const PORT = process.env.PORT || 3000;
const url= process.env.url || 'mongodb://localhost/SWC_Media'
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");


//mongoose setup
//mongoose.connect("mongodb://localhost/SWC_Media" , {useUnifiedTopology: true ,useNewUrlParser: true,useFindAndModify: false});
mongoose.connect("mongodb+srv://satyendra:1234@cluster0-afmf0.mongodb.net/test?retryWrites=true&w=majority" , {useUnifiedTopology: true ,useNewUrlParser: true,useFindAndModify: false});

//Schema setup

//media Schema
var mediaSchema=mongoose.Schema({
	name:String,
	path:String
});

var Media=mongoose.model("Media", mediaSchema);

//user schema setup
var UserSchema = new mongoose.Schema({
    outlookId: String,
    name: String,
    email: String,
    accessToken:  String
})
var User = mongoose.model("User", UserSchema);

//adding sample video
// Media.create({name:"sample1", path:"assets/sample1.mp4"}, function(err, media){
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
    // var user = {
    //   outlookId: profile.id,
    //   name: profile.DisplayName,
    //   email: profile.EmailAddress,
    //   accessToken:  accessToken
    // };
    // if (refreshToken)
    //   user.refreshToken = refreshToken;
    // if (profile.MailboxGuid)
    //   user.mailboxGuid = profile.MailboxGuid;
    // if (profile.Alias)
    //   user.alias = profile.Alias;
    // User.findOrCreate(user, function (err, user) {
    //   return done(err, user);
    // });
    User.findOne({
        outlookId: profile.id
    }, function(err, user){
        if(err){
            done(err);
        }
        //if no user was found then create one
        if(!user){
          var str = profile._json.DisplayName;
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


//home page route
app.get('/', function(req, res){
    Media.find({}, function(err, media){
		if(err){
			console.log(err);
		}else{
			res.render('home', {media:media})
		}
	})
});

//video player route
app.get('/video/:id', function(req, res){
	
	Media.findById(req.params.id, function(err, foundVideo){
		if(err){
			console.log(err);
		}else{
			res.render("index", {video:foundVideo});
		}
	})
	
})

app.get('/video/watch/:id',async (req,res)=>{

	Media.findById(req.params.id, function(err, foundMedia){
		if(err){
			console.log(err)
		}else{
			const path=foundMedia.path;
			
			try{
				fs.stat(path,(err,stat)=>{
					if(err){throw err}
					const fileSize=stat.size
					const range=req.headers.range
					console.log(range)
					if(range){
						const parts=range.replace(/bytes=/,"").split('-')
						const start=parseInt(parts[0],10)
						const end=parts[1]?
							parseInt(parts[1],10)
							:fileSize-1
						const chunksize=(end-start)+1
						const file=fs.createReadStream(path,{start,end})
						res.writeHead(206,{
							'Content-Range':`bytes ${start}-${end}/${fileSize}`,
							'Accept-Ranges':'bytes',
							'Content-Length':chunksize,
							'Content-Type':'video/mp4'
						})
						file.pipe(res)
					}
					else{
						res.writeHead(200,{
							'Content-Length':fileSize,
							'Content-Type':'video/mp4'
						})
						fs.createReadStream(path).pipe(res)
					}
		
				})
			}
			catch(err){
				console.log(err)
			}
		}
	})
})

//auth routes
//login route
app.get('/auth/outlook',
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
app.get('/auth/outlook/callback', 
  passport.authenticate('windowslive', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log(req.user);
    res.redirect('/');
  });
//logout route
app.get('/logout', function(req, res){
    req.session.destroy(function(err) {
      req.logOut();
      res.redirect('/');
    });
  });
  
app.listen(PORT, function(){
    console.log("SWC Media server has started");
});
