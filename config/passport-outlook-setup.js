const OutlookStrategy = require("passport-outlook")
const User = require("../models/user");

module.exports = (passport) => {
    passport.use(
        new OutlookStrategy(
            {
                clientID: process.env.clientID,
                clientSecret: process.env.clientSecret,
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

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
}
