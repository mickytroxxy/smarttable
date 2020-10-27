var app     =     require("express")();
var mysql   =     require("mysql");
var http    =     require('http').Server(app);
var io      =     require("socket.io")(http);
var nodemailer = require('nodemailer');
var mkdirp = require('mkdirp');
var upload = require("express-fileupload");
//var request = require('request');
//var OneSignal = require('onesignal-node');
app.use(upload());
app.use('/files',require("express").static(__dirname + '/files'));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'DELETE, PUT, POST, GET');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if ('OPTIONS' == req.method) {
    res.sendStatus(200);
  }
  else {
    next();
  }
});
var connection    =    mysql.createPool({
  connectionLimit   :   150,
  host              :   'localhost',
  port              :   3306,
  user              :   'root',
  password          :   '',
  database          :   'qoutationdb',
  debug             :   false,
  multipleStatements : true
});
io.sockets.on('connection', function (socket) {
  console.log('a user has connected client '+socket.id);
  socket.on("getShopCategories", function(shopId,cb){
    connection.query('SELECT DISTINCT category FROM items WHERE shopId=?', [shopId],function(err,result){
      cb(result);
    });
  })
  socket.on("getRecent",function(cb){
    connection.query('SELECT * FROM client_details ORDER BY RAND() LIMIT 10',[],function(error,result){
      if (!error) {
        cb(result);
      }
    });
  });
  socket.on("search-keyRef",function(keyRef,cb){
    connection.query('SELECT * FROM client_details WHERE Key_Ref=? LIMIT 1',[keyRef],function(error,result){
      if (!error) {
        cb(result);
      }
    });
  });
  socket.on("saveClient",function(fname,lname,cellNo,regNo,vehicleMake,branch,cb){
    var Key_Ref = regNo.slice(0,3) + Math.floor(Math.random()*8999+1000);
    connection.query('INSERT INTO client_details SET ?', {Fisrt_Name:fname,Last_Name:lname,Cell_number:cellNo,Reg_No:regNo,Make:vehicleMake,branch:branch,Key_Ref:Key_Ref}, function (err, results, fields) {
      if (!err) {
        cb(Key_Ref)
      }else{
        cb(false);
        console.log(err);
      }
    });
  });
  socket.on("saveBookingPhoto", function(Key_Ref,photo_type,url,cb){
    connection.query('INSERT INTO securityphotos SET ?', {Key_Ref:Key_Ref,photo_type:photo_type,url:url}, function (err, results, fields) {
      if (!err) {
        cb(true)
      }else{
        cb(false);
        console.log(err);
      }
    });
  });
  socket.on("saveOtherPhoto", function(Key_Ref,photo_type,url,category,cb){
    console.log("Hey................................ "+photo_type);
    connection.query('INSERT INTO track_photos SET ?', {Key_Ref:Key_Ref,picture_comment:photo_type,picture_name:url,category:category}, function (err, results, fields) {
      if (!err) {
        cb(true)
      }else{
        cb(false);
        console.log(err);
      }
    });
  });
  socket.on("saveStock", function(stockDesc,stockAmount,stockNa,stockSupplier,stockCategory,stockBranch,stockUrl,cb){
    console.log(stockCategory);
    connection.query('INSERT INTO stock SET ?', {description:stockDesc,price:stockAmount,alias:stockNa,supplier:stockSupplier,catergory:stockCategory,branch:stockBranch,icon:stockUrl}, function (err, results, fields) {
      if (!err) {
        cb(true);
        console.log("Its done baba");
      }else{
        cb(false);
        console.log(err);
      }
    });
  });
  socket.on("savePaint", function(description,amount,quantity,supplier,size,branch,icon,cb){
    connection.query('INSERT INTO stock_paint SET ?', {description:description,amount:amount,quantity:quantity,supplier:supplier,size:size,branch:branch,icon:icon}, function (err, results, fields) {
      if (!err) {
        cb(true);
        console.log("Its done baba");
      }else{
        cb(false);
        console.log(err);
        //http://192.168.0.185:8080/mag_qoutation/mag_snapshot/security_images/MS1005091/A1%20license%20Disk-07-20-09-34-37.jpg
        //http://192.168.0.185:2000/images/mag_security/MS1009428/A3%20Bonnet-10-19-07-42-08.jpg
      }
    });
  });
  socket.on("trackDriver", function(latitude,longitude,userId){
    console.log(userId+" is at "+latitude+" -- "+longitude);
  });
  socket.on("login", function(branch,password,cb){
    var userId = Math.floor(Math.random()*899999+100099);
    cb(userId)
  });
});
http.listen(3000, function() {
  console.log("Listening on 3000");
  connection.getConnection(function(err,conn){  
    if (!!err) {
      console.log("database Access Denied "+err);
    }else{
      conn.release();
      console.log("database Access granted");
    }
  });
});
app.post("/upload",function(req,res){
  console.log("About to upload files...");
  if (req.files) {
    console.log(req.files)
    var file=req.files.fileUrl;
    var filePath=req.body.filePath;
    var pathToBeCreated = req.body.filePath.split("/");
    pathToBeCreated.pop();
    mkdirp(pathToBeCreated.join('/'), function (err) {
      if (err) console.error(err)
      else console.log('directory avatar was created');
      file.mv(filePath,function(err){
        if (err) {
          console.log(err);
        }else{
          res.send("success");
          console.log("100% uploaded");
        }
      });
    });
  }
});
app.post("/uploadFile111",function(req,res){
  console.log("About to upload files...");
  if (req.files) {
    console.log(req.files)
    var file=req.files.fileUrl;
    var filePath=req.body.filePath;
    file.mv("./"+filePath,function(err){
      if (err) {
        console.log(err);
      }else{
        res.send("success");
        console.log("100% uploaded");
      }
    });
  }
});
