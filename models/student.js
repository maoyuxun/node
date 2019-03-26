var mongoose = require('mongoose');

var studentschema = mongoose.Schema({
    sid:String,
    name:String,
    grade:String,
    password:String,
    nochangepassword:{type:Boolean,default:false},
    mycourses:[String]
});


studentschema.statics.import = function(workSheetsFromBuffer){

    var str = "ABDEFGHJKLMNPQRSTUVWXYZabdefghjkmnpqrtuvwxyz123456789%$^&";

    var gradearry = ["初一","初二","初三","高一","高二","高三"];

    mongoose.connection.collection("students").drop(function(){

        for(var i=0;i<workSheetsFromBuffer.length;i++){
            for(var j=1;j<workSheetsFromBuffer[i].data.length;j++){
                var password="";
                for(var m=0;m<6;m++){
                    password += str.charAt(parseInt(str.length*Math.random()));
                }
                var s = new Student({
                    sid:workSheetsFromBuffer[i].data[j][0],
                    name:workSheetsFromBuffer[i].data[j][1],
                    grade:gradearry[i],
                    password:password
                })
                s.save();
            }
        }

    })

}

var Student = mongoose.model("Student",studentschema);

module.exports = Student;