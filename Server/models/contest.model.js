// MONGOOSE SCHEMA
const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var contestSchema = new Schema({
  contestId: String,
  contestName: String,
  contestDate: String,
  contestDuration: String,
  contestStartTime: String,
  contestEndTime: String,
  multiset: { type: Boolean, default: false },
  sets: Array,
  mcq: { type: Boolean, default: false },
  usernames: [ String ],
  sections: [ String ],
});

module.exports = mongoose.model("Contest", contestSchema);
