const Skill = require("../models/skill.model.js");
const WeekSkill = require("../models/weekSkill.model.js");
const inarray = require("inarray");
const xlsx = require("xlsx");

exports.createExcel = (req, res) => {
  let currDate = req.body.date;
  let commonWeek = currDate;
  WeekSkill.find({})
    .sort({ weekId: 1 })
    .then((weekskills) => {
      var count = weekskills.length;
      var i = 0,
        f = 0;
      var prevDate = weekskills[0]["weekId"];
      while (
        parseInt(weekskills[i]["weekId"].substring(0, 4)) <
        parseInt(currDate.substring(0, 4))
      )
        ++i;
      while (
        parseInt(weekskills[i]["weekId"].substring(5, 7)) <
        parseInt(currDate.substring(5, 7))
      )
        ++i;
      while (
        -parseInt(weekskills[i]["weekId"].substring(8, 10)) +
          parseInt(currDate.substring(8, 10)) >
        6
      )
        ++i;
      prevDate = weekskills[i]["weekId"];
      while (i < count && f < 2) {
        var date1 = new Date(prevDate);
        var date2 = new Date(currDate);
        var Difference_In_Time = date1.getTime() - date2.getTime();
        var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

        var prevDay = date1.getDay();
        var currDay = date2.getDay();

        if (Difference_In_Days >= 0) {
          if (Difference_In_Days <= 6 && currDay <= prevDay) {
            commonWeek = prevDate;
            break;
          }
        } else {
          if (-Difference_In_Days <= 6 && currDay > prevDay) {
            commonWeek = prevDate;
            break;
          }
        }
        ++f;
        ++i;
        prevDate = weekskills[i]["weekId"];
      }
    });

  if (req.files.upfile) {
    var file = req.files.upfile,
      name = file.name,
      type = file.mimetype;
    var week = req.body.date;
    var uploadpath = "../Public/current_leaderboard";
    file.mv(uploadpath, function (err) {
      if (err) {
        console.log("File Upload Failed", name, err);
        res.send("Error Occured!");
      } else {
        let wb = xlsx.readFile("../Public/current_leaderboard");
        let ws = wb.Sheets["Sheet1"];
        let data = xlsx.utils.sheet_to_json(ws);
        let skill, weekSkill;
        WeekSkill.deleteOne({ weekId: commonWeek })
          .then((weekSkills) => {
            if (!weekSkills) {
              return res.status(404).send({
                success: false,
                message: "week not found with id " + commonWeek,
              });
            }
            res.send(weekSkills);
          })
          .catch((err) => {
            if (err.kind === "ObjectId" || err.name === "NotFound") {
              return res.status(404).send({
                success: false,
                message: "week not found with id " + commonWeek,
              });
            }
            return res.status(500).send({
              success: false,
              message: "Could not delete week with id " + commonWeek,
            });
          });
        WeekSkill.find()
          .then((weekSkills) => {
            weekSkill = new WeekSkill({
              dateId: new Date(),
              weekId: week,
            });
            // Save Week Skill in the database
            weekSkill.save();
          })
          .catch((err) => {
            res.status(500).send({
              success: false,
              message:
                err.message || "Some error occurred while retrieving week.",
            });
          });
        Skill.deleteMany({ weekId: commonWeek })
          .then((skills) => {
            if (!skills) {
              return res.status(404).send({
                success: false,
                message: "skills not found with week id " + commonWeek,
              });
            }
            res.send(skills);
          })
          .catch((err) => {
            if (err.kind === "ObjectId" || err.name === "NotFound") {
              return res.status(404).send({
                success: false,
                message: "skill not found with id " + commonWeek,
              });
            }
            return res.status(500).send({
              success: false,
              message: "Could not delete skill with id " + commonWeek,
            });
          });
        Skill.find()
          .then((skills) => {
            for (let i = 0; i < data.length; i++) {
              skill = new Skill({
                weekId: week,
                rank: data[i]["Rank"],
                rollNumber: data[i]["Roll Number"],
                hackerRank: data[i]["HackerRank (HR)"],
                codeChef: data[i]["CodeChef (CC)"],
                codeforces: data[i]["Codeforces (CF)"],
                interviewBit: data[i]["InterviewBit (IB)"],
                spoj: data[i]["Spoj (S)"],
                geeksForGeeks: data[i]["Geeks For Geeks (GFG)"],
                buildIT: data[i]["BuildIT"],
                overallScore: data[i]["Overall Score"],
                weeklyPerformance: data[i]["Weekly Performance"],
                points: data[i]["Points"],
              });
              // Save Skill in the database
              skill.save();
            }
            // res.send("Done! Uploaded files");
          })
          .catch((err) => {
            res.status(500).send({
              success: false,
              message:
                err.message || "Some error occurred while retrieving skills.",
            });
          });
      }
    });
  } else {
    res.send("No File selected !");
    res.end();
  }
};

exports.findAll = (req, res) => {
  Skill.find()
    .then((skill) => {
      res.send(skill);
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message: err.message || "Some error occurred while retrieving skills.",
      });
    });
};

exports.findOne = (req, res) => {
  Skill.find({ weekId: req.params.week })
    .then((skill) => {
      if (!skill) {
        return res.status(404).send({
          success: false,
          message: "Week not found with week Id " + req.params.week,
        });
      }
      res.send(skill);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          success: false,
          message: "Week not found with week Id  " + req.params.week,
        });
      }
      return res.status(500).send({
        success: false,
        message: "Error retrieving user with id " + req.params.week,
      });
    });
};

exports.findRecent = (req, res) => {
  Skill.find()
    .sort({ weekId: 1 })
    .then((skill) => {
      if (!skill) {
        return res.status(404).send({
          success: false,
          message: "Week not found with week Id",
        });
      }
      let arr = [];
      let i = skill.length - 1;
      let week = skill[i].weekId;
      while (i >= 0 && skill[i].weekId === week) {
        arr.push(skill[i]), (i = i - 1);
      }
      res.send(arr);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          success: false,
          message: "Week not found with week Id",
        });
      }
      return res.status(500).send({
        success: false,
        message: "Error retrieving user with id",
      });
    });
};

exports.findAllWeeks = (req, res) => {
  WeekSkill.find()
    .sort({ weekId: 1 })
    .then((weekSkill) => {
      res.send(weekSkill);
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message: err.message || "Some error occurred while retrieving weeks.",
      });
    });
};