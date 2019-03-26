var mongoose = require('mongoose');

var courseschems = new mongoose.Schema({
    "cid" : String,
    "name" : String,
    "dayofweek" : String,
    "number" : Number,
    "allow" : [String],
    "teacher" : String,
    "briefintro" : String,
    "mystudents":[String]

})

var Course = mongoose.model("Course",courseschems);

module.exports = Course;