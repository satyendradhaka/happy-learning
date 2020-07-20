const express = require("express"),
  app = express(),
  passport = require("passport"),
  mongoose = require("mongoose"),
  OutlookStrategy = require("passport-outlook"),
  bodyParser = require("body-parser"),
  keys = require("./keys"),
  User = require("./models/user"),
  Media = require("./models/media"),
  methodOverride = require("method-override"),
  Course = require("./models/course"),
  PORT = process.env.PORT || 3000,
  url = "mongodb://localhost/SWC_Media";
//url = keys.mongodb.url || 'mongodb://localhost/SWC_Media';
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/assets"));
var streamRoutes = require("./routes/streaming"),
  indexRoutes = require("./routes/index"),
  testingRoutes = require("./routes/testing"),
  adminRoutes = require("./routes/adminRoutes"),
  uploadRoute = require("./routes/uploadRoute");

mongoose.connect(url, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false,
});

//passport configuration
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);



app.use(
  session({
    secret: "once again pkmb",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  next();
});
passport.use(
  new OutlookStrategy(
    {
      clientID: keys.outlook.clientID,
      clientSecret: keys.outlook.clientSecret,
      //callbackURL: process.env.callbackURL
      callbackURL: "/auth/outlook/callback",
    },
    function (accessToken, refreshToken, params, profile, done) {
      User.findOne(
        {
          outlookId: profile.id,
        },
        function (err, user) {
          if (err) {
            done(err);
          }
          //if no user was found then create one
          if (!user) {
            var str = profile._json.EmailAddress;
            var n = str.search("@iitg.ac.in");
            if (n != -1) {
              user = new User({
                outlookId: profile._json.Id,
                name: profile._json.DisplayName,
                email: profile._json.EmailAddress,
                accessToken: accessToken,
              });
              user.save(function (err) {
                if (err) console.log(err);
                return done(err, user);
              });
            }
          } else {
            return done(err, user);
          }
        }
      );
    }
  )
);

//Setup routes
app.use("/", indexRoutes);
app.use("/courses/:id/", streamRoutes);
app.use("/", testingRoutes);
app.use("/admin", adminRoutes);
app.use("/admin", uploadRoute);

//Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send(
    err.status ? err : { message: "Internal server error, check server log" }
  );
  if (!err.status) {
    console.log(err);
  }
});

app.listen(PORT, function () {
  console.log("SWC Media server has started");
});
