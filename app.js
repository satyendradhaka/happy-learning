const express = require("express");
const app = express();
const passport = require("passport");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const PORT = process.env.PORT || 3000;
const url = process.env.url || 'mongodb://localhost/SWC_Media';
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

//Requiring Routes
const streamRoutes = require("./routes/streaming");
const indexRoutes = require("./routes/index");
const testingRoutes = require("./routes/testing");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoute = require("./routes/uploadRoute");

//Requiring passport-setup
require("./config/passport-outlook-setup")(passport);

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

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.session = req.session;
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
