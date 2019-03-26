var formidable = require('formidable');

var student = require("../models/student.js");

var course = require("../models/course.js");
var _ = require("underscore");


var  crypto=require('crypto');

exports.showadmin = function(req,res){
    res.render("admin/xuanke.ejs",{
        page:"xuanke"
    })
}
exports.showbaobiao = function(req,res){
    res.render("admin/baobiao.ejs",{
        page:"baobiao"
    })
}

exports.showlogin = function(req,res){
    res.render("login.ejs")
}

exports.dologin = function(req,res){
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        var sid = fields.sid;
        var password = fields.password;
        student.find({"sid":sid},function(err,results){
            if(err){
                res.json({"result":-1});
                return;
            }
            if(results.length == 0 ){
                res.json({"result" : -2});
                return;
            }
            var nochangepassword = results[0].nochangepassword;
            if(!nochangepassword){
                //密码没改
                if(password == results[0].password){
                    req.session.login = true;
                    req.session.sid = sid;
                    req.session.name = results[0].name;
                    req.session.nochangepassword = results[0].nochangepassword;
                    console.log(req.session.nochangepassword);
                    res.json({"result":1}); //正确
                    return

                }else {
                    res.json({"result":-3});//密码错误
                    return
                }
            }else {
                if(results[0].password == crypto.createHash('sha256').update(password).digest('hex') ){
                    req.session.login = true;
                    req.session.sid = sid;
                    req.session.name = results[0].name;
                    req.session.nochangepassword = results[0].nochangepassword;
                    console.log(req.session.nochangepassword);
                    res.json({"result":1}); //正确
                    return
                }else {
                    res.json({"result":-3});//密码错误
                    return
                }
            }
        })
    })
}

exports.showtable = function(req,res){
    if(req.session.login != true){
        res.redirect("/login");
        return;
    }
    if(req.session.nochangepassword == false ){
        console.log(req.session.nochangepassword);
        res.redirect("/changepw");
        return;
    }

    res.render("index.ejs",{
        "sid":req.session.sid,
        "name":req.session.name

    })


}
exports.logout = function(req,res){
    req.session.login = false;
    req.session.sid ="";
    res.redirect("/login");
}

exports.showchangepw = function(req,res){
    if(req.session.login != true){
        res.redirect("/login");
        return;
    }
    res.render("changepw.ejs",{
        "sid":req.session.sid,
        "name":req.session.name,
        "nochangepassword":req.session.nochangepassword
    })

}


exports.dochangepw = function(req,res){
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        var pw = fields.password;

        student.find({"sid":req.session.sid},function(err,result){
            var thestudent = result[0];
            req.session.nochangepassword = true;
            thestudent.nochangepassword = true;
            thestudent.password = crypto.createHash('sha256').update(pw).digest('hex');
            console.log(thestudent.password);
            thestudent.save();
            res.json({"result" : 1});
            return
        })
    })
}
exports.check = function(req,res){
    //登录验证！如果你没有携带login的session
    if(req.session.login != true){
        res.redirect("/login");
        return;
    }
    var results = {};

    //找到我这个人
    student.find({"sid" : req.session.sid},function(err,students){
        var thestudent = students[0];
        //已经报名的课程序号数组
        var mycourses = thestudent.mycourses;
        //学生的年级
        var grade = thestudent.grade;
        //已经被占用的星期
        var occupyWeek = [];

        //查询所有课程，查询一次
        course.find({},function(err,courses){
            //需要查询一次，但是需要遍历两次。
            //第一次遍历是看清全局信息，这个学生报名的课程有哪些？都占用了哪些日子？
            //第二次遍历是带着第一次遍历的结果，回答这门课能不能报名的信息。
            //遍历所有课程
            courses.forEach(function(item){
                if(mycourses.indexOf(item.cid) != -1){
                    //已经被占用的星期
                    occupyWeek.push(item.dayofweek);
                }
            });

            //比如，cidMapDayofweek就是["周二","周三"]

            courses.forEach(function(item){
                if(mycourses.indexOf(item.cid) != -1){
                    //如果已经报名了这个课程
                    results[item.cid] = "已经报名此课";
                }else if(occupyWeek.indexOf(item.dayofweek) != -1){
                    //如果这个课课程星期已经被占用
                    results[item.cid] = "当天被占用";
                }else if(item.number <= 0){
                    //如果人数不够了
                    results[item.cid] = "人数不够了";
                }else if(item.allow.indexOf(grade) == -1){
                    //如果年级不符合要求
                    results[item.cid] =  "年级不符合要求";
                }else if(occupyWeek.length == 2){
                    //如果年级不符合要求
                    results[item.cid] =  "已达报名上限";
                }else{
                    results[item.cid] = "可以报名";
                }
            });

            res.json(results);
        });
    });
}


exports.baoming = function(req,res){
    //学号
    var sid = req.session.sid;
    //要报名的课程编号
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var cid = fields.cid;

        student.find({"sid" : sid },function(err,students){
            students[0].mycourses.push(cid);
            students[0].save(function(){
                course.find({"cid" : cid} , function(err,courses){
                    courses[0].mystudents.push(sid);
                    courses[0].number --;
                    courses[0].save(function(){
                        res.json({"result" : 1});
                    })
                })
            });
        });
    });
}

//退报
exports.tuibao = function(req,res){
    //学号
    var sid = req.session.sid;
    //要报名的课程编号
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var cid = fields.cid;

        student.find({"sid" : sid },function(err,students){
            students[0].mycourses = _.without(students[0].mycourses,cid);
            students[0].save(function(){
                course.find({"cid" : cid} , function(err,courses){
                    courses[0].mystudents = _.without(courses[0].mystudents,sid);
                    courses[0].number++;
                    courses[0].save(function(){
                        res.json({"result" : 1});
                    })
                })
            });
        });
    });
}