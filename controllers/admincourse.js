
var course  = require("../models/course.js");
var fs = require("fs");
var formidable = require('formidable');
var mongoose = require("mongoose");
var url = require("url");
var dateformat = require("date-format");

exports.showcourse = function(req,res){
    res.render("admin/course.ejs",{
        page:"course"
    })
}
exports.showcourseimport = function(req,res){
    res.render("admin/course/courseimport.ejs",{
        page:"course"
    })
}

exports.showcourseadd = function(req,res){
    res.render("admin/course/courseadd.ejs",{
        page:"course"
    })
}

exports.doshangchuan = function(req,res){
    var form = new formidable.IncomingForm();
    form.uploadDir = "./upload";
    form.keepExtensions = true;
    form.parse(req, function(err, fields, files) {
        if(err){
            res.send("导入失败");
            return
        }
       fs.readFile(files.coursejson.path,function(err,data){
           if(err){
               res.send("导入失败");
               return
           }
           var dataobj = JSON.parse(data.toString());
           mongoose.connection.collection("courses").drop(function(err){
               if(err){
                   res.send("导入失败");
                   return
               }
               course.insertMany(dataobj.courses,function(err,result){
                   if(err){
                       res.send("导入失败");
                       return
                   }
                   console.log(result)
                   res.send("成功导入"+result.length+"条数据");
               })
           });

       })
    })
}

exports.showqingdan = function(req,res){
    var rows = url.parse(req.url,true).query.rows;
    var page = url.parse(req.url,true).query.page;
    var sidx = url.parse(req.url,true).query.sidx;
    var sord = url.parse(req.url,true).query.sord;
    var keyword = url.parse(req.url,true).query.keyword;

    var sordNumber = sord == "asc" ? 1 : -1;
    if(keyword === undefined || keyword == ""){
        var findFiler = {}; //空对象，检索全部
    }else{
        //我们使用正则表达式的构造函数来将字符串转为正则对象
        //我们发现eval也同样好用var regexp = eval("/" + keyword + "/g");
        //★★★★★★★★★★★★★★★★★★★★★★★★★
        //模糊查询最有价值语句：MVS， most valuble statement
        var regexp = new RegExp(keyword , "g");
        //★★★★★★★★★★★★★★★★★★★★★★★★★
        var findFiler = {
            $or : [
                {"cid": regexp},
                {"name": regexp},
                {"teacher": regexp},
                {"briefintro":regexp}

            ]
        }
    }
    course.count(findFiler,function(err,count){

        var total = Math.ceil(count / rows);
        var sortobj = {};
        //动态绑定一个键
        sortobj[sidx] = sordNumber;
        course.find(findFiler).sort(sortobj).skip(rows * (page - 1)).exec(function(err,result){
            res.json({"records" : count, "page" : page, "total" : total ,"rows":result});
        })
    })
}

exports.updatacourse = function(req,res){

    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {

        var cid = fields.cid;

        course.find({"cid":cid},function(err,result){
            if(result.length==0){
                res.send({"result":-1});
                return;
            }
            var thecourse = result[0];
            thecourse.name = fields.name;
            thecourse.dayofweek = files.dayofweek;
            thecourse.number = fields.number;
            thecourse.allow = fields.allow.split(",");
            thecourse.teacher = fields.teacher;
            thecourse.briefintro=fields.briefintro;
            thecourse.save(function(err){
                res.send({"result":1});
            })


        })
    })

}

exports.deletecourse = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        course.remove({"cid":fields.arr},function(err){
            if(err){
                res.json({"result" : -1});
                return

            }
            res.json({"result":1});
        })
    })
}

exports.download = function(req,res){

    course.find({},function(err,result){
        var sheetR = [];
        result.forEach(function(item){
            sheetR.push([
                item.cid,
                item.name,
                item.dayofweek,
                item.number,
                item.allow,
                item.teacher,
                item.briefintro
            ]);
        });


        var filename = dateformat('yyyy年MM月dd日hhmmss', new Date());


        fs.writeFile("./public/txt/"+filename+".txt",sheetR,function(err){

            res.redirect("/txt/"+filename+".txt");
        });

    })
}


exports.chechcid= function(req,res){
    //拿到参数
    var cid = parseInt(req.params.cid);

    course.count({"cid" : cid},function(err,count){
        if(err){
            res.json({"result" : -1});
            return;
        }
        res.json({"result" : count});
    });
};



exports.doadd = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {


        if(err){
            res.send({"result":-1}); //-1表示服务器错误
            return
        }

        var cid =fields.cid;

        if(!/[\d]/.test(cid)){
            res.send({"result":-2}); //-2表示cid不符合规范
        }
        var name = fields.name;
        if(!/^[\u4E00-\u9FA5]{2,30}/.test(name)){
            res.send({"result" : -3});      //-3表示课程名称不合规范
            return;
        }

        var dayofweek = fields.dayofweek;
        var number = fields.number;
        if(!/[\d]$/.test(number)){
            res.send({"result":-4}); //-4表示人数不符合规范
        }
        var allow = fields.allow;
        var teacher = fields.teacher;

        if(!/^[\u4E00-\u9FA5]{2,5}(?:·[\u4E00-\u9FA5]{2,5})*$/.test(teacher)){
            res.send({"result" : -5});      //-5表示教师名字不合规范
            return;
        }

        var briefintro = fields.briefintro;
        if(!/^[\u4E00-\u9FA5]{2,500}/.test(briefintro)){
            res.send({"result" : -6});      //-6表示简介不合规范
            return;
        }

        var s = new course({
            cid    : cid,
            name   : name,
            dayofweek  : dayofweek,
            number : number,
            allow :allow,
            teacher:teacher,
            briefintro:briefintro
        });
        s.save(function(err){
            if(err){
                res.json({"result" : -1});
                return;
            }
            res.json({"result" : 1});
        });

    })
}