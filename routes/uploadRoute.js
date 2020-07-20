let express = require("express");
let router = express.Router();
let dirname = require('../dirname');
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const fileUpload = require("express-fileupload");
var fs = require("fs");

let Course = require("../models/course");
let Media = require("../models/media");

//Setting up directory for file saving
router.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/assets/videos/",
  })
);

ffmpeg.setFfmpegPath(dirname.dirpath + "/ffmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath(dirname.dirpath + "/ffmpeg/bin/ffprobe.exe");

//Video upload and conversion to DASH manifest
router.post("/courses/:id", isAdmin, (req, res) => {
  // console.log(course.title);
  req.files.video.mv(
    __dirname + "/assets/videos/" + req.files.video.name,
    (err) => {
      if (err) return err;

      console.log("Video uploaded successfully");
    }
  );

  const sizes = [
    [240, 350],
    [480, 700],
    [720, 2500],
  ];
  const fallback = [480, 400];
  const fileName =
    req.files.video.name.split(".").slice(0, -1).join(".") + "-" + Date.now();
  const fn = req.files.video.name;
  const name = path.basename(fn, path.extname(fn));
  const targetdir = path.join(__dirname, "/assets/mpd/", fileName);

  const sourcefn = path.join(
    __dirname,
    "/assets/videos/",
    req.files.video.name
  );

  console.log("source:", sourcefn);
  console.log("target:", targetdir);
  console.log("name:", name);
  console.log("fn:", fn);
  try {
    var targetdirInfo = fs.statSync(targetdir);
  } catch (err) {
    if (err.code === "ENOENT") {
      fs.mkdirSync(targetdir);
    } else {
      throw err;
    }
  }

  var proc = ffmpeg({
    source: sourcefn,
    cwd: targetdir,
  });

  var targetfn = path.join(targetdir, `dash.mpd`);

  proc
    .output(targetfn)
    .format("dash")
    .videoCodec("libx264")
    .audioCodec("aac")
    .audioChannels(2)
    .audioFrequency(44100)
    .outputOptions([
      "-preset veryfast",
      "-keyint_min 60",
      "-g 60",
      "-sc_threshold 0",
      "-profile:v main",
      "-use_template 1",
      "-use_timeline 1",
      "-b_strategy 0",
      "-bf 1",
      "-map 0:a",
      "-b:a 96k",
    ]);

  for (var size of sizes) {
    let index = sizes.indexOf(size);

    proc.outputOptions([
      `-filter_complex [0]format=pix_fmts=yuv420p[temp${index}];[temp${index}]scale=-2:${size[0]}[A${index}]`,
      `-map [A${index}]:v`,
      `-b:v:${index} ${size[1]}k`,
    ]);
  }

  //Fallback version (video file)
  // proc
  //   .output(path.join(targetdir, `${name}.mp4`))
  //   .format("mp4")
  //   .videoCodec("libx264")
  //   .videoBitrate(fallback[1])
  //   .size(`?x${fallback[0]}`)
  //   .audioCodec("aac")
  //   .audioChannels(2)
  //   .audioFrequency(44100)
  //   .audioBitrate(128)
  //   .outputOptions([
  //     "-preset veryfast",
  //     "-movflags +faststart",
  //     "-keyint_min 60",
  //     "-refs 5",
  //     "-g 60",
  //     "-pix_fmt yuv420p",
  //     "-sc_threshold 0",
  //     "-profile:v main",
  //   ]);

  proc.on("start", function (commandLine) {
    console.log("progress", "Spawned Ffmpeg with command: " + commandLine);
  });

  proc
    .on("progress", function (info) {
      console.log("progress", info);
    })
    .on("end", function () {
      //res.send('success');

      Course.findById(req.params.id, function (err, foundCourse) {
        if (err) throw err;

        let media = {
          title: req.body.title,
          filePath: "/mpd/" + fileName + "/dash.mpd",
        };

        Media.create(media, function (err, newlyCreated) {
          if (err) {
            console.log(err);
          } else {
            //add course id to media
            newlyCreated.course = req.params.id;
            //save media
            newlyCreated.save();
            foundCourse.videos.push(newlyCreated);
            foundCourse.save();
            console.log(newlyCreated);
            res.redirect("/admin/courses/" + req.params.id);
          }
        });
      });
    })
    .on("error", function (err) {
      console.log("error", err);
    });

  proc.run();
});
//middleware
function isAdmin(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.isAdmin) {
      return next();
    }
  }
  res.redirect("/");
}

module.exports = router;
