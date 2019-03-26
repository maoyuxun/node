var express = require("express")

var app = express();
var session = require('express-session');
var mongoose = require('mongoose');

var adminstudent  = require("./controllers/adminstudent.js");
var admincourse = require("./controllers/admincourse.js");

var main = require("./controllers/admin.js");
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/xuanxiu');

app.use(session({
    secret: 'mao',
    cookie: { maxAge:  6000000},
    resave: true,
    //强制“未初始化”的会话保存到存储。
    saveUninitialized: true,
}))

app.set("view engine","ejs");

app.get("/admin",main.showadmin);

app.get("/admin/baobiao",main.showbaobiao);

//下面是学生路由
app.get("/admin/student",adminstudent.showstudent);
app.get("/admin/student/download",adminstudent.download);
app.get("/admin/student/import",adminstudent.showstudentimport);
app.post("/admin/student/import",adminstudent.doshangchuan);
app.get("/admin/student/add",adminstudent.showaddstudent);
app.get("/student",adminstudent.showqingdan);
app.post("/student",adminstudent.doadd);
app.delete("/student",adminstudent.deletestudent);
app.post("/student/:sid",adminstudent.updatastudent);
app.propfind("/student/:sid",adminstudent.checksid);


app.get("/admin/course",admincourse.showcourse);
app.get("/admin/course/import",admincourse.showcourseimport);
app.post("/admin/course/import",admincourse.doshangchuan);
app.get("/admin/course/add",admincourse.showcourseadd);
app.get("/admin/course/download",admincourse.download);
app.get("/course",admincourse.showqingdan);
app.post("/admin/course",admincourse.updatacourse);
app.delete("/course",admincourse.deletecourse);
app.post("/course",admincourse.doadd);
app.propfind("/course/:cid",admincourse.chechcid);
app.use(express.static("public"));


app.get("/login",main.showlogin);
app.post("/login",main.dologin);
app.get("/",main.showtable);
app.get("/logout",main.logout);
app.get("/changepw",main.showchangepw);
app.post("/changepw",main.dochangepw);
app.get("/check",main.check);
app.post("/baoming",main.baoming);
app.post("/tuibao",main.tuibao);

app.listen(3000);

console.log("服务器开启3000端口");