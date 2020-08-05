//'mongodb://localhost/SWC_Media'
const express = require("express");
const app = express();
const User = require("./models/user")
const token = require("./models/token")
const passport = require("passport");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const PORT = process.env.PORT || 3000;
const url = process.env.url ||  "mongodb+srv://satyendra:1234@cluster0-afmf0.mongodb.net/test?retryWrites=true&w=majority";
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const nodemailer = require('nodemailer');
const LocalStrategy 		  = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
//Requiring Routes
const streamRoutes = require("./routes/streaming");
const indexRoutes = require("./routes/index");
const testingRoutes = require("./routes/testing");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoute = require("./routes/uploadRoute");
const flash= require("connect-flash");

//mongoose setup
mongoose.connect(url, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false,
});



app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/assets"));
app.use(flash());

app.use(
  session({
    secret: "once again pkmkb & ckmkb",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection },
    ),
    cookie: { maxAge: 180 * 60 * 1000 }
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.session = req.session;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});


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
