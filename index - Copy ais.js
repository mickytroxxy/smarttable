var app     =     require("express")();
var mysql   =     require("mysql");
var http    =     require('http').Server(app);
var io      =     require("socket.io")(http);
var nodemailer = require('nodemailer');
var connection    =    mysql.createPool({
  connectionLimit   :   100,
  host              :   '127.0.0.1',
  port              :   3306,
  user              :   'root',
  password          :   '',
  database          :   'dial_code',
  debug             :   false,
  multipleStatements : true
});
io.sockets.on('connection', function (socket) {
  console.log('a user has connected');
  socket.on("getProgress",(fromDate,toDate,userId,cb)=>{
    connection.query('SELECT * FROM test_date WHERE date BETWEEN ? AND ?', [from,to],function(err,results,fields){
      if(!err){
        const unique = [...new Set(results.map(item => item.cars))].length;
        console.log(unique)
      }else{
        console.log(err)
      }
    });
  });
});
app.get("/",function(req,res){
  //res.sendFile(__dirname+"/freenetserver/index.html");
})
app.use('/files',require("express").static(__dirname + '/freenetserver'));
http.listen(process.env.PORT || 5100, function() {
  console.log("Listening on 5100");
  connection.getConnection(function(err,conn){  
    if (!!err) {
      console.log("database Access Denied "+err);
    }else{
      conn.release();
      console.log("database Access granted");
      getTestData('2021-01-01','2021-01-09');
    }
  });
});
const getTestData=(from,to)=>{
  var resultObj=[];
  connection.query('SELECT * FROM securityphotos WHERE date BETWEEN ? AND ?', [from,to],function(err,results,fields){
    if(!err){
      const cars = [...new Set(results.map(item => item.Key_Ref))].length;
      resultObj.push({category:"BOOKING PHOTOS",cars:cars,photos:results.length})

      connection.query('SELECT * FROM track_photos WHERE category=? AND date BETWEEN ? AND ?', ['ACCIDENT',from,to],function(err,results,fields){
        if(!err){
          const cars = [...new Set(results.map(item => item.Key_Ref))].length;
          resultObj.push({category:"ACCIDENT PHOTOS",cars:cars,photos:results.length});

          connection.query('SELECT * FROM track_photos WHERE category=? AND date BETWEEN ? AND ?', ['WORK IN PROGRESS',from,to],function(err,results,fields){
            if(!err){
              const cars = [...new Set(results.map(item => item.Key_Ref))].length;
              resultObj.push({category:"WORK IN PROGRESS",cars:cars,photos:results.length})

              connection.query('SELECT * FROM track_photos WHERE category=? AND date BETWEEN ? AND ?', ['FINAL STAGE',from,to],function(err,results,fields){
                if(!err){
                  const cars = [...new Set(results.map(item => item.Key_Ref))].length;
                  resultObj.push({category:"FINAL STAGE",cars:cars,photos:results.length})
                  
                  connection.query('SELECT * FROM track_photos WHERE category=? AND date BETWEEN ? AND ?', ['ADDITIONALS',from,to],function(err,results,fields){
                    if(!err){
                      const cars = [...new Set(results.map(item => item.Key_Ref))].length;
                      resultObj.push({category:"ADDITIONALS",cars:cars,photos:results.length})
                    }else{
                      console.log(err)
                    }
                  });
                }else{
                  console.log(err)
                }
              });
            }else{
              console.log(err)
            }
          });
        }else{
          console.log(err)
        }
      });
    }else{
      console.log(err)
    }
  });
}