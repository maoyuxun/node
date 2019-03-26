var formidable = require('formidable');
var path = require("path");
var fs = require("fs");
var url = require("url");
var xlsx = require("node-xlsx");
var student = require("../models/student.js");
var dateformat = require("date-format");


exports.showstudent = function(req,res){
    res.render("admin/student.ejs",{
        page:"student"
    })
}



exports.showstudentimport = function(req,res){
    res.render("admin/student/studentimport.ejs",{
        page:"student"
    })
}



exports.showaddstudent = function(req,res){
    res.render("admin/student/studentadd.ejs",{
        page:"student"
    })
}

exports.doadd = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {


        if(err){
            res.send({"result":-1}); //-1表示服务器错误
            return
        }
        var sid = fields.sid;

        if(!/^[\d]{9}$/.test(sid)){
            res.send({"result":-2}); //-2表示id不符合规范
        }




        var name = fields.name;

        if(!/^[\u4E00-\u9FA5]{2,5}(?:·[\u4E00-\u9FA5]{2,5})*$/.test(name)){
            res.json({"result" : -3});      //-3表示姓名不合规范
            return;
        }

        var grade = fields.grade;
        var password = fields.password;
        if(checkStrength(password) != 3){
            res.json({"result" : -4});  //密码强度有问题
            return;
        }

        function checkStrength(password){
            //积分制
            var lv = 0;
            if(password.match(/[a-z]/g)){lv++;}
            if(password.match(/[0-9]/g)){lv++;}
            if(password.match(/(.[^a-z0-9])/g)){lv++;}
            if(password.length < 6){lv=0;}
            if(lv > 3){lv=3;}

            return lv;
        }

        student.count({"sid" : sid},function(err,count){
            if(err){
                res.json({"result" : -1});
                return;
            }
            if(count != 0){
                res.json({"result" : -5});  //-5表示用户名被占用
                return;
            }


            var s = new Student({
                sid    : fields.sid,
                name   : fields.name,
                grade  : fields.grade,
                password : fields.password
            });
            s.save(function(err){
                if(err){
                    res.json({"result" : -1});
                    return;
                }
                res.json({"result" : 1});
            });
        });
    })
}


exports.deletestudent = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        student.remove({"sid":fields.arr},function(err){
            if(err){
                res.json({"result" : -1});
                return

            }
            res.json({"result":1});
        })
    })
}

exports.checksid = function(req,res){
    //拿到参数
    var sid = parseInt(req.params.sid);

    student.count({"sid" : sid},function(err,count){
        if(err){
            res.json({"result" : -1});
            return;
        }
        res.json({"result" : count});
    });
};
exports.doshangchuan = function(req,res){
    var form = new formidable.IncomingForm();
    form.uploadDir = "./upload";
    form.keepExtensions = true;
    form.parse(req, function(err, fields, files) {

        if(path.extname(files.studentexcel.name)!=".xlsx"){
            fs.unlink("./"+files.studentexcel.path,function(err){
                if(err){
                    console.log("删除文件错误");
                    return
                }
                res.send("上传文件类型不正确");
            });
            return;
        };

        var workSheetsFromBuffer = xlsx.parse("./"+files.studentexcel.path);
        if(workSheetsFromBuffer.length !=6){
            res.send("缺少年级");
            return

        }
        for(var i=0;i<workSheetsFromBuffer.length;i++){
            if(
                workSheetsFromBuffer[i].data[0][0]!="学号" ||
                workSheetsFromBuffer[i].data[0][1]!="姓名"
            ){
                res.send( "表格的首行不正确,应是学号-姓名-性别");
                return

            }
        }
        student.import(workSheetsFromBuffer,function(){

        })

        //至此，正确了
        res.send("上传成功")


    });

}


exports.showqingdan = function(req,res){
    //拿到参数
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
                {"sid": regexp},
                {"name": regexp},
                {"grade": regexp}
            ]
        }
    }
    student.count(findFiler,function(err,count){

        var total = Math.ceil(count / rows);
        var sortobj = {};
        //动态绑定一个键
        sortobj[sidx] = sordNumber;
        student.find(findFiler).sort(sortobj).skip(rows * (page - 1)).exec(function(err,result){
            res.json({"records" : count, "page" : page, "total" : total ,"rows":result});
        })

    })
}

exports.updatastudent = function(req,res){
    var sid = req.params.sid;
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var key = fields.cellname;
        var value = fields.value;
        console.log(sid);
        student.find({"sid":sid},function(err,result){

            if(result.length==0){
                res.send({"result":-1});
                return;
            }
            var thestudent = result[0];
            thestudent[key]=value;
            thestudent.save(function(err){
                res.send({"result":1});
            })


        })
    })
}

exports.download = function(req,res){
    var TableR = [];
    var gradeArr = ["初一","初二","初三","高一","高二","高三"];


    function iterator(i){
        if(i == 6){

            var buffer = xlsx.build(TableR);

            var filename = dateformat('yyyy年MM月dd日hhmmss', new Date());


            fs.writeFile("./public/xlsx/"+filename+".xlsx",buffer,function(err){

                res.redirect("/xlsx/"+filename+".xlsx");
            });
            return;
        }
        //整理数据
        student.find({"grade":gradeArr[i]},function(err,results){
            var sheetR = [];
            results.forEach(function(item){
                sheetR.push([
                    item.sid,
                    item.name,
                    item.grade,
                    item.password
                ]);
            });

            TableR.push({"name" : gradeArr[i], data : sheetR});
            //迭代！
            iterator(++i);
        });
    }

    iterator(0);
}

