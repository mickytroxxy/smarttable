var app     =     require("express")();
var mysql   =     require("mysql");
var http    =     require('http').Server(app);
var io      =     require("socket.io")(http);
var nodemailer = require('nodemailer');
var Twocheckout = require('2checkout-node');
var mkdirp = require('mkdirp');
var upload = require("express-fileupload");
var paypal = require('paypal-rest-sdk');
var request = require('request');
var OneSignal = require('onesignal-node');
var waitingUsers=[];
var payFastWait=[];
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
paypal.configure({
  'mode': 'live', //sandbox or live
  'client_id': 'AXfJ7VWbFGmRmusrM2h-CyuQTi04sftzBo9DleBaCn3kIDJdhza8PNq2cB2nMR1Xp8QV_lfGKhzGIoiX',
  'client_secret': 'EOXf6dTkKsaayUAhCKWDx37QiQoLhuAJCrzROe24RlPu1-drTskHWefovXaGhwiKQlxHYABDSBd5vZtX'
});
var myClient = new OneSignal.Client({      
  userAuthKey: 'ZjUyMjM3MWYtOTkzNC00MjczLThmYjItZjBiOGEyMzdkNjBi',           
  app: { appAuthKey: 'NzUwMGRlMzYtYzZmNS00NjI5LWE3MmItZWI1MWE5ZWYxMTc5', appId: '1c5b73c7-86a7-4bb3-89e3-5226a18b62fc' }      
});
var connection    =    mysql.createPool({
  connectionLimit   :   150,
  host              :   '159.89.83.199',
  port              :   3306,
  user              :   'mickytroxxy',
  password          :   '7624TROXXy!',
  database          :   'smartstore',
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
  socket.on('add-item',function(itemName, itemDesc, itemBuying, itemSelling, itemBarcode, itemCategory, timeAdded, itemQuantity, shopId, itemWeight,itemIcon,category,smartRestaurant,expiryDate, cb){
    connection.query('SELECT * FROM items WHERE itemBarcode=? AND shopId=?',[itemBarcode,shopId],function(error,result){
      if (!error) {
        if (result.length==0 || itemBarcode=='NO BARCODE') {
          connection.query('INSERT INTO items SET ?', {itemName:itemName, itemDesc:itemDesc, itemBuying:itemBuying, itemSelling:itemSelling, itemBarcode:itemBarcode, itemCategory:itemCategory, timeAdded:timeAdded, itemQuantity:itemQuantity, shopId:shopId, itemWeight:itemWeight, itemIcon:itemIcon, category:category, smartRestaurant:smartRestaurant,special:'',discount:'',buyHowMany:'',getHowMany:'',specialDue:'',expiryDate:expiryDate}, function (err, results, fields) {
            if (!err) {
              cb(200,'success')
            }else{
              cb(400,'There was an error while trying to add your item')
            }
          });
        }else{
          cb(201,'The barcode you have entered is already in your shop. Try to manage it instead');
        }
      }
    });
  })
  socket.on('getItemByBarcode', function(readBarcode,shopId,cb){
    if (readBarcode=='NO BARCODE') {
      var sql = 'SELECT * FROM items WHERE shopId=? ORDER BY RAND() LIMIT 16';
      var property = [shopId];
    }else{
      var sql = 'SELECT * FROM items WHERE itemBarcode=? AND shopId=?';
      var property = [readBarcode,shopId];
    }
    connection.query(sql,property,function(error,result){
      if (!error) {
        cb(result);
      }
    });
  });
  socket.on('getSmartRestaurant', function(shopId,cb){
    connection.query('SELECT * FROM items WHERE smartRestaurant=? AND shopId=? ORDER BY RAND() LIMIT 12',['YES',shopId],function(error,result){
      if (!error) {
        cb(result);
      }
    });
  });
  socket.on('getSmartRestaurantItemsByCategory', function(category,shopId,cb){
    connection.query('SELECT * FROM items WHERE smartRestaurant=? AND shopId=? AND category=? ORDER BY RAND() LIMIT 12',['YES',shopId,category],function(error,result){
      if (!error) {
        cb(result);
      }
    });
  });
  socket.on('getItemsByCategory', function(category,shopId,cb){
    console.log(category)
    if (category!="SPECIALS" && category!="ALL ITEMS") {
      connection.query('SELECT * FROM items WHERE category=? AND shopId=?',[category,shopId],function(error,result){
        if (!error) {
          cb(result);
        }
      });
    }else if (category=="ALL ITEMS") {
      connection.query('SELECT * FROM items WHERE shopId=? ORDER BY RAND() LIMIT 16',[shopId],function(error,result){
        if (!error) {
          cb(result);
        }
      });
    }else if (category=="SPECIALS") {
      connection.query('SELECT * FROM items WHERE special!=? AND shopId=?',["",shopId],function(err,result){
        if (!err) {
          console.log(result);
          cb(result);
        }
      });
    }
  });
  socket.on('getShopDetails', function(shopId,cb){
    connection.query('SELECT * FROM shops WHERE shopId=?',[shopId],function(error,result){
      if (!error) {
        if (result.length>0) {
          for (var i = 0; i < result.length; i++){
            var shopName=result[i].shopName;
            var shopDes=result[i].shopDes;
            var activationDate=result[i].activationDate;
            var package=result[i].package;
            var months=result[i].months;
            var currencyCode=result[i].currencyCode;
            var remoteOrdering=result[i].remoteOrdering;
            var latitude=result[i].latitude;
            var longitude=result[i].longitude;
            var workingHours=result[i].workingHours;
            var smartDriver=result[i].smartDriver;
            cb(shopId,shopName,shopDes,activationDate,months,package,currencyCode,remoteOrdering,latitude,longitude,workingHours,smartDriver);
          }
        }else{
          cb(0,0)
        }
      }
    });
  });
  socket.on("getShopsWithSpecial", function(shopId,cb){
    connection.query('SELECT * FROM items WHERE special!=? AND shopId=?',["",shopId],function(err,result){
      if (!err) {
        cb(result);
      }
    });
  });
  socket.on('get-payment-history', function(buyerNumber,userLogged,shopId,cb){
    if (userLogged=='customer') {
      var sql = 'SELECT * FROM payments WHERE buyerNumber=?';
      var identifier=buyerNumber;
    }else{
      var sql = 'SELECT * FROM payments WHERE shopId=?';
      var identifier=shopId;
    }
    var emptyArray = [];
    connection.query(sql,[identifier],function(error,result){
      if (!error) {
        if (result.length>0) {
          var len=result.length;
          for (var i = 0; i < result.length; i++){
            (function(x){
               setTimeout(function () {
                  var orderNumber=result[x].id;
                  var shopId=result[x].shopId;
                  var itemListString=result[x].itemListString;
                  var amount=result[x].amount;
                  var totalWeight=result[x].totalWeight;
                  getShopName(shopId,function(shopName){//ca-app-pub-7273251331335061~6896216034   cordova plugin add cordova-plugin-admob-free --save --variable ADMOB_APP_ID="ca-app-pub-7273251331335061~6896216034"
                    /*len--;
                    emptyArray.push({orderNumber:orderNumber,shopId:shopId,itemListString:itemListString,amount:amount,totalWeight:totalWeight,shopName:shopName});
                    if (len==0) {
                      cb(emptyArray);
                    }*/
                    socket.emit('get-payment-history', orderNumber,shopId,shopName,itemListString,amount,totalWeight);
                  })
               }, 300 * i);
            })(i);
          }
        }else{
          cb(result);
        }
      }
    });
  });
  socket.on('register-shop', function(shopId,shopName,shopAddress,shopEmail,shopCategory,password,adminName,adminId,shopDes,staffPhone,countryCode,activationDate,cb){
    if (shopAddress==null) {
      shopAddress = "";
      fname = shopName;
    }
    var workingHours = [{day:'Sun',openTime:'8:00',closeTime:'20:00',id:1},{day:'Mon',openTime:'8:00',closeTime:'20:00',id:2},{day:'Tue',openTime:'8:00',closeTime:'20:00',id:3},{day:'Wed',openTime:'8:00',closeTime:'20:00',id:4},{day:'Thu',openTime:'8:00',closeTime:'20:00',id:5},{day:'Fri',openTime:'8:00',closeTime:'20:00',id:6},{day:'Sat',openTime:'8:00',closeTime:'20:00',id:7}]
    connection.query('SELECT * FROM shops WHERE shopEmail=?',[shopEmail],function(error,result){
      if (!error) {
        if (result.length==0) {
          connection.query('SELECT * FROM country WHERE dial_code=?',[countryCode],function(error,result){
            if (!error) {
              if (result.length>0) {
                var currencyCode = result[0].currency_code;
              }else{
                var currencyCode = 'USD';
              }
              connection.query('INSERT INTO shops SET ?', {shopId:shopId, shopName:shopName, shopAddress:shopAddress, shopEmail:shopEmail, shopCategory:shopCategory, password:password, shopDes:shopDes, activationDate:activationDate, latitude:0, longitude:0, staffPhone:staffPhone, playerId:'', remoteOrdering:'TRUE', package:'TRIAL', months:0, pawnBuy:'FALSE',operationalRadius:'30',countryCode:countryCode,currencyCode:currencyCode,workingHours:JSON.stringify(workingHours),smartDriver:'TRUE'}, function (err, results, fields) {
                if (!err) {
                  connection.query('INSERT INTO shopusers SET ?', {fname:adminName, position:'ADMIN', userId:adminId, shopId:shopId, staffEmail:shopEmail, staffPass:password, staffPhone:staffPhone, playerId:''}, function (err, results, fields) {
                    if (!err) {
                      console.log("New shop has been added called "+shopName);
                      var msg = 'Hi '+adminName+'. Thank you for registering with us, Your shop ID is '+shopId+', password is '+password+', Email is '+shopEmail+'. Please keep this message safe.'
                      cb(200,currencyCode);
                      sendEmail(shopEmail,'YOUR STORE DETAILS',msg);
                    }else{
                      console.log(err)
                    }
                  });
                }else{
                  console.log(err)
                }
              });
            }
          });
        }else{
          cb(400,"ZAR")
        }
      }
    });
  });
  socket.on('login', function(email_address,password,cb){
    console.log('Trying to log in........... '+email_address)
    var resArray;
    connection.query('SELECT * FROM shopusers WHERE staffEmail=? AND staffPass=?', [email_address,password],function(err,result){
      cb(result)
    }); 
  });
  socket.on('setShopDetails', function(shopId,cb){
    connection.query('SELECT * FROM shops WHERE shopId=?', [shopId],function(err,res){
      cb(res);
      console.log('Trying to log in........... '+res)
    });
  });
  socket.on('loginStaff', function(email_address,password,cb){
    var resArray;
    console.log('Trying to log in........... '+email_address)
    connection.query('SELECT * FROM shopusers WHERE staffEmail=? AND staffPass=?', [email_address,password],function(err,result){
      if (result.length>0) {
        resArray = result;
        connection.query('SELECT * FROM shops WHERE shopId=?', [result[0].shopId],function(err,res){
          resArray.push({storeName : res[0].shopName, currencyCode:res[0].currencyCode})
          cb(resArray);
        });
      }else{
        cb(result);
      }
    }); 
  });
  socket.on('shop-view-reports', function(shopId,cb){
    connection.query('SELECT DISTINCT purchaseDay FROM payments WHERE shopId=?', [shopId],function(err,result){
      connection.query('SELECT * FROM payments WHERE shopId=?',[shopId],function(error,res){
        if (!error) {
         connection.query('SELECT * FROM expenses WHERE shopId=?',[shopId],function(error,expensesRes){
          if (!error) {
           connection.query('SELECT * FROM damaged_goods WHERE shopId=?',[shopId],function(error,damagedRes){
              if (!error) {
               cb(result,res,expensesRes,damagedRes); 
              }
            });
          }
        });
        }
      });
    });
  });
  socket.on('update-item', function(itemName, itemDesc,itemBuying, itemSelling, itemQuantity, shopId, itemId, cb){
    connection.query('UPDATE items SET ? WHERE ?', [{ itemName: itemName, itemDesc: itemDesc, itemBuying: itemBuying, itemSelling: itemSelling, itemQuantity: itemQuantity}, { id: itemId }],function(err,result){
      if (!err) {
        cb(200)
      }else{
        cb(0);
      }
    });
  });
  socket.on("addExpense", function(shopId,description,quantity,amount,cb){
    connection.query('INSERT INTO expenses SET ?', {shopId:shopId,description:description,quantity:quantity,amount:amount}, function (err, results, fields) {
      if (!err) {
        cb(true)
      }else{
        console.log(err)
      }
    });
  });
  socket.on("addItemToDamaged", function(shopId,id,itemName,quantity,amount,cb){
    console.log(id)
    connection.query('SELECT * FROM items WHERE id=?',[id],function(error,result){
      if (!error) {
        var itemQuantity = parseFloat(result[0].itemQuantity) - parseFloat(quantity);
        if (itemQuantity>-1) {
          connection.query('UPDATE items SET ? WHERE ?', [{itemQuantity: itemQuantity}, { id: id }],function(err,result){
            if (!err) {
              connection.query('INSERT INTO damaged_goods SET ?', {shopId:shopId,itemName:itemName,quantity:quantity,amount:amount}, function (err, results, fields) {
                if (!err) {
                  cb(200)
                }else{
                  console.log(err)
                }
              });
            }else{
              cb(false);
              console.log(err);
            }
          });
        }else{
          cb(false)
        }
      }
    });
  });
  socket.on('get-manage-item', function(barcode,shopId,cb){
    connection.query('SELECT * FROM items WHERE itemBarcode=? AND shopId=?',[barcode,shopId],function(error,result){
      if (!error) {
        if (result.length>0) {
          for (var i = 0; i < result.length; i++){
            var id=result[i].id;
            var itemName=result[i].itemName;
            var itemDesc=result[i].itemDesc;
            var itemSelling=result[i].itemSelling;
            var itemQuantity=result[i].itemQuantity;
            var itemBuying=result[i].itemBuying;
            if (parseFloat(itemQuantity)>0) {
              cb(200,itemName,itemDesc,itemSelling,id,itemBuying,itemQuantity,itemDesc);
            }else{
              cb('we do not have '+itemName+' anymore!',0,0,0,0,0)
            }
          }
        }else{
          cb('There is no such barcode in the system!',0,0,0,0,0)
        }
      }
    });
  });
  socket.on('remove-item', function(itemId,cb){
    connection.query('DELETE FROM items WHERE id=?',[itemId],function(error,result){
      if (!error) {
        cb(200)
      }
    });
  });
  socket.on('get-most-purchased', function(shopId){
    connection.query('SELECT * FROM mostitems WHERE shopId=? ORDER BY itemQuantity DESC',[shopId],function(error,result){
      if (!error) {
        if (result.length>0) {
          for (var i = 0; i < result.length; i++){
            (function(x){
               setTimeout(function () {
                  var itemId=result[x].itemId;
                  var itemQuantity=result[x].itemQuantity;
                  getItemById(itemId,function(itemName,itemSelling,itemBuying){
                    console.log('i have found '+itemId+' '+itemName+' '+itemQuantity+' '+itemSelling+' '+itemBuying);
                    socket.emit('get-most-purchased', itemId,itemQuantity,itemName,itemSelling,itemBuying);
                  });
               }, 500 * i);
            })(i);
          }
        }
      }
    });
  });
  socket.on('shop-add-user', function(fname,position,userId,shopId,staffEmail,staffPass,staffPhone,cb){
    connection.query('INSERT INTO shopusers SET ?', {fname:fname, position:position, userId:userId, shopId:shopId,staffEmail:staffEmail,staffPass:staffPass, staffPhone:staffPhone, playerId:''}, function (err, results, fields) {
      if (!err) {
        cb(200)
      }else{
        console.log(err)
      }
    });
  });
  socket.on('shop-get-users', function(shopId,cb){
    connection.query('SELECT * FROM shopusers WHERE shopId=?',[shopId],function(error,result){
      if (!error) {
        cb(result);
      }
    });
  });
  socket.on('getCustomerCare', function(shopId,cb){
    connection.query('SELECT * FROM shopusers WHERE shopId=? AND position=?',[shopId,'CUSTOMER CARE'],function(error,result){
      if (!error) {
        cb(result);
      }
    });
  });
  socket.on('log-user-in', function(userId,shopId,cb){
    connection.query('SELECT * FROM shopusers WHERE userId=? AND shopId=?',[userId,shopId],function(error,result){
      if (!error) {
        if (result.length>0) {
          for (var i = 0; i < result.length; i++){
            var position=result[i].position;
            cb(200,position)
          }
        }else{
          cb(0,0)
        }
      }
    });
  });
  socket.on('get-order-number', function(orderNo,cb){
    connection.query('SELECT * FROM payments WHERE id=?',[orderNo],function(error,result){
      if (!error) {
        if (result.length>0) {
          for (var i = 0; i < result.length; i++){
            var itemListString=result[i].itemListString;
            var amount=result[i].amount;
            var verifiedBy=result[i].verifiedBy;
            var totalWeight=result[i].totalWeight;
            if (verifiedBy=='') {
              cb(200,itemListString,amount,totalWeight);
            }else{
              cb(0,'The order number provided was verified already!',0)
            }
          }
        }else{
          cb(0,'The order number provided does not exist!',0);
        }
      }
    });
  });
  socket.on('verify-order', function(orderNo,verifiedBy,cb){
    connection.query('UPDATE payments SET ? WHERE ?', [{ verifiedBy: verifiedBy}, { id: orderNo }],function(err,result){
      if (!err) {
        cb(200)
      }else{
        cb(0)
      }
    });
  });
  socket.on('updateWorkingHours', function(shopId,workingHoursString,cb){
    connection.query('UPDATE shops SET ? WHERE ?', [{ workingHours: workingHoursString}, {shopId: shopId}],function(err,result){
      if (!err) {
        cb(true)
      }else{
        cb(false)
      }
    });
  });
  socket.on('findBarcodeDetails', function(barcode,cb){
    connection.query('SELECT * FROM items WHERE itemBarcode=? LIMIT 1',[barcode],function(error,result){
      if (!error) {
        if (result.length>0) {
          for (var i = 0; i < result.length; i++){
            var id=result[i].id;
            var itemName=result[i].itemName;
            var itemDesc=result[i].itemDesc;
            var itemSelling=result[i].itemSelling;
            var itemBuying=result[i].itemBuying;
            var itemWeight=result[i].itemWeight;
            cb(200,itemName,itemDesc,itemWeight,itemSelling,itemBuying);
          }
        }else{
          cb(0)
        }
      }
    });
  });
  socket.on('shop-payment', function(shopId,cb){
    connection.query('UPDATE payments SET ? WHERE ?', [{ rushPaid: 'Yes'}, { shopId: shopId }],function(err,result){
      if (!err) {
        cb(200)
      }else{
        cb(0)
      }
    });
  });
  socket.on('update-store', function(shopDes,shopAddress,shopName,password,shopId,operationalRadius,cb){
    connection.query('UPDATE shops SET ? WHERE ?', [{ shopDes: shopDes, shopAddress:shopAddress, shopName:shopName, password:password,operationalRadius:operationalRadius}, { shopId: shopId }],function(err,result){
      if (!err) {
        cb(200)
      }else{
        cb(0)
      }
    });
  });
  socket.on('CashierID', function(CashierID,theNewCost,phoneNo,amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight){
    io.sockets.emit('CashierID-Verify', CashierID,theNewCost,phoneNo,amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight);
  });
  socket.on('finalizeCashPayment', function(amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight){
    savePaymentDetails(amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight,socket);
    console.log('Hey there look at '+buyerNumber)
  });
  socket.on('getItemOfSameMass', function(shopId,itemId,cb){
    getItemWeight(itemId,shopId,function(itemWeight,itemSelling){
      connection.query('SELECT * FROM items WHERE shopId=? AND itemWeight=?',[shopId,itemWeight],function(error,result){
        if (!error) {
          console.log('The item itemWeight is '+itemWeight)
          if (result.length>1) {
            for (var i = 0; i < result.length; i++){
              var otherPrice=result[i].itemSelling;
              if(parseFloat(otherPrice) > parseFloat(itemSelling)){
                cb(true);
              }else{
                cb(false);
              }
            }
          }else{
            cb(false);
          }
        }
      });
    });
  });
  socket.on('search-item', function(latitude,longitude,radius,itemInput){
    connection.query('SELECT *, ( 6371 * acos( cos( radians('+latitude+') ) * cos( radians( shops.latitude ) ) * cos( radians(shops.longitude) - radians('+longitude+')) + sin(radians('+latitude+')) * sin( radians(shops.latitude)))) AS distance FROM shops HAVING distance < '+radius+' ORDER BY distance', [],function(err,result){
      if (result.length>0) {
        for (var i = 0; i < result.length; i++){
          (function(x){
             setTimeout(function () {
                var shopName=result[x].shopName;
                var shopAddress=result[x].shopAddress;
                var shopId=result[x].shopId;
                var dbLatitude=result[x].latitude;
                var dbLongitude=result[x].longitude;

                connection.query("SELECT * FROM items WHERE itemName LIKE ? AND shopId=? ORDER BY itemSelling DESC",['%'+itemInput+'%',shopId],function(err,result){
                  if (result.length>0) {
                    for (var i = 0; i < result.length; i++){
                      var itemName=result[i].itemName;
                      var itemSelling=result[i].itemSelling;
                      var itemQuantity=result[i].itemQuantity;
                      socket.emit('item-found', shopId,shopName,shopAddress,itemName,itemSelling,itemQuantity,dbLatitude,dbLongitude);
                    }
                  }else{
                    console.log('No such item from '+shopId)
                  }
                });
             }, 300 * i);
          })(i);
        }
      }else{
        console.log('Noting here!')
        socket.emit('no-results-found', 'NO RESULT FOUND !');
      }
    });
  });
  socket.on('updateLocation', function(latitude,longitude,shopId){
    connection.query('UPDATE shops SET ? WHERE ?', [{ latitude: latitude, longitude:longitude}, { shopId: shopId }],function(err,result){});
  });
  socket.on('addCategory', function(category,companyId,cb){
    connection.query('INSERT INTO categories SET ?', {category:category,companyId:companyId}, function (err, results, fields) {
      if (!err) {
        cb(true);
      }else{
        cb(false);
      }
    });
  });
  socket.on("getCategories", function(companyId,cb){
    console.log("getting categories "+companyId)
    connection.query('SELECT * FROM categories WHERE companyId=?', [companyId],function(err,result){
      cb(result);
    }); 
  });
  socket.on('getOrdersShop', function(companyId,buyerNumber,cb){
    connection.query('SELECT * FROM payments WHERE shopId=? ORDER BY id DESC LIMIT 20', [companyId],function(err,result){
      cb(result);
    });
  });
  socket.on('getOrdersCustomer', function(companyId,buyerNumber,cb){
    connection.query('SELECT * FROM payments WHERE buyerNumber=?  ORDER BY id DESC LIMIT 20', [buyerNumber],function(err,result){
      cb(result);
    });
  });
  socket.on('getItemDetails', function(itemId,cb){
    connection.query('SELECT * FROM items WHERE id=?', [itemId],function(err,result){
      cb(result);
    }); 
  });
  socket.on("customerLogin", function(storeId,cb){
    getShopDetails(storeId,function(result){
      cb(result)
    })
  });
  socket.on('askForWaiter', function(companyId,tableNo,cb){
    io.sockets.emit("askForWaiter", companyId,tableNo);
    cb(true)
  });
  socket.on('updateAdminPlayerId', function(playerId,shopId){//4854 4221 1870 7913 / 03.21 / 024
    connection.query('UPDATE shops SET ? WHERE ?', [{ playerId: playerId}, { shopId: shopId }],function(err,result){});
  });
  socket.on('updateAdminPlayerId', function(playerId,shopId){
    connection.query('UPDATE shops SET ? WHERE ?', [{ playerId: playerId}, { shopId: shopId }],function(err,result){});
  });
  socket.on('updateEmployeesPlayerId', function(playerId,userId){
    connection.query('UPDATE shopusers SET ? WHERE ?', [{ playerId: playerId}, { userId: userId }],function(err,result){});
  });
  socket.on('updateCustomerPlayerId', function(playerId,phoneNo,latitude,longitude){
    connection.query('UPDATE customers SET ? WHERE ?', [{ playerId: playerId, latitude:latitude, longitude:longitude}, { phone: phoneNo }],function(err,result){});
  });
  socket.on("dumm-registration", function(full_name,phone,email_address,password,cb){
    console.log(full_name+' '+email_address+' '+password);
    connection.query('SELECT * FROM dummtable WHERE email_address=?', [email_address],function(err,result){
      if (!err) {
        if (result.length==0) {
          connection.query('INSERT INTO dummtable SET ?', {full_name:full_name,phone:phone,email_address:email_address,password:password}, function (err, results, fields) {
            if (!err) {
              cb(true);
            }else{
              cb(false);
              console.log(err);
            }
          });
        }else{
          console.log(err);
          cb(false);
        }
      }
    });
  });
  socket.on('dummLogin', function(email_address,password,cb){
    connection.query('SELECT * FROM dummtable WHERE email_address=? AND password=?', [email_address,password],function(err,result){
      cb(result);
    });
  });
  socket.on('sendConSms', function(phone,code,contactType,cb){
    if (contactType=='phoneNumber') {
      sendSms(phone,'Hi, your smartStore verification code is '+code)
    }else{
      sendEmail(phone,'SMARTSTORE CONFIRMATION CODE','Hi, your smartStore verification code is '+code);
    }
  });
  socket.on('updatePhone', function(phone,countryCode,deliveryAddress,latitude,longitude,cb){
    connection.query('SELECT * FROM country WHERE dial_code=?',[countryCode],function(error,result){
      if (!error) {
        if (result.length>0) {
          var currencyCode = result[0].currency_code;
        }else{
          var currencyCode = 'USD';
        }
        connection.query('SELECT * FROM customers WHERE phone=?', [phone],function(err,result){
          if (result.length>0) {
            connection.query('UPDATE customers SET ? WHERE ?', [{ currencyCode: currencyCode, deliveryAddress:deliveryAddress, latitude:latitude, longitude:longitude}, {phone: phone }],function(err,result){
              if (!err) {
                cb(true,currencyCode)
              }else{
                cb(false,currencyCode);
              }
            });
          }else{
            connection.query('INSERT INTO customers SET ?', {phone:phone,playerId:'',currencyCode:currencyCode,deliveryAddress:deliveryAddress,latitude:latitude,longitude:longitude}, function (err, results, fields) {
              if (!err) {
                cb(true,currencyCode);
              }else{
                cb(false,currencyCode);
                console.log(err);
              }
            });
          }
        });
      }
    });
  });
  socket.on('getPawnSell', function(phone,pawnOrSell,category,cb){
    connection.query('SELECT * FROM pawnsell WHERE itemOwner=? AND pawnOrSell=? AND category=?', [phone,pawnOrSell,category],function(err,result){
      cb(result);
      console.log(phone+' getting '+pawnOrSell);
    });
  });
  socket.on('addPawnSell', function(itemName,itemDec,expectedCash,itemIcon,latitude,longitude,date,pawnOrSell,itemOwner,category,cb){
    connection.query('INSERT INTO pawnsell SET ?', {itemName:itemName,itemDec:itemDec,expectedCash:expectedCash,itemIcon:itemIcon,latitude:latitude,longitude:longitude,date:date,pawnOrSell:pawnOrSell,itemOwner:itemOwner,shopId:'',acceptedOffer:'',status:'RUNNING',toPay:'',category:category}, function (err, results, fields) {
      if (!err) {
        cb(true);
      }else{
        cb(false);
        console.log(err);
      }
    });
  });
  socket.on("getNearByAgents", function(latitude,longitude,cb){
    connection.query('SELECT *, ( 6371 * acos( cos( radians('+latitude+') ) * cos( radians( shops.latitude ) ) * cos( radians(shops.longitude) - radians('+longitude+')) + sin(radians('+latitude+')) * sin( radians(shops.latitude)))) AS distance FROM shops HAVING distance < 250 AND pawnBuy=? ORDER BY distance DESC', ['TRUE'],function(err,result){
      cb(result)
    });
  });
  socket.on("getLocalStores", function(latitude,longitude,cb){
    connection.query('SELECT *, ( 6371 * acos( cos( radians('+latitude+') ) * cos( radians( shops.latitude ) ) * cos( radians(shops.longitude) - radians('+longitude+')) + sin(radians('+latitude+')) * sin( radians(shops.latitude)))) AS distance FROM shops HAVING distance < 250 ORDER BY distance DESC', [],function(err,result){
      cb(result)
    });
  });
  socket.on("getLocalStoresByCategory", function(latitude,longitude,category,cb){
    connection.query('SELECT *, ( 6371 * acos( cos( radians('+latitude+') ) * cos( radians( shops.latitude ) ) * cos( radians(shops.longitude) - radians('+longitude+')) + sin(radians('+latitude+')) * sin( radians(shops.latitude)))) AS distance FROM shops HAVING distance < 250 AND shopCategory=? ORDER BY distance DESC', [category],function(err,result){
      cb(result)
    });
  });
  socket.on('terminatePawnSell', function(id,cb){
    connection.query('DELETE FROM pawnsell WHERE id=?',[id],function(error,result){
      if (!error) {
        cb(true);
      }else{
        cb(false);
      }
    });
  });
  socket.on('getBids', function(id,cb){
    connection.query('SELECT * FROM bids WHERE itemId=?', [id],function(err,result){
      cb(result);
    });
  });
  socket.on('acceptBid', function(shopId,acceptedOffer,id,toPay,cb){
    connection.query('SELECT * FROM pawnsell WHERE id=? AND status=?', [id,'RUNNING'],function(err,result){
      if (result.length>0) {
        connection.query('UPDATE pawnsell SET ? WHERE ?', [{ shopId: shopId,acceptedOffer:acceptedOffer,toPay:toPay,status:'COMPLETED'}, { id: id }],function(err,result){
          if (!err) {
            cb(true)
          }else{
            cb(false);
            console.log(err);
          }
        });
      }else{
        cb(false)
      }
    });
  });
  socket.on('getPawnBuy', function(latitude,longitude,pawnOrSell,radius,category,cb){
    connection.query('SELECT *, ( 6371 * acos( cos( radians('+latitude+') ) * cos( radians( pawnsell.latitude ) ) * cos( radians(pawnsell.longitude) - radians('+longitude+')) + sin(radians('+latitude+')) * sin( radians(pawnsell.latitude)))) AS distance FROM pawnsell HAVING distance < '+radius+' AND pawnOrSell=? AND status=? AND category=? ORDER BY distance', [pawnOrSell,'RUNNING',category],function(err,result){
      cb(result)
    });
  });
  socket.on('getServiceAvailable', function(currencyCode,shopId,cb){
    console.log('The currencyCode is .......... '+currencyCode+'   '+shopId);
    getServiceAvailable(currencyCode,shopId,function(serviceFee,result,paypalRes){
      cb(serviceFee,result,paypalRes);
    })
  });
  socket.on("getExtraCharges", function(i,cb){
    connection.query('SELECT sum(serviceFee) AS a FROM payments WHERE rushPaid=? AND shopId=?', ['NO',i],function(err,b){
      var amount = b[0].a;
      if (b[0].a!=null) {
        amount = amount;
      }else{
        amount = 0;
      }
      connection.query('SELECT * FROM shops WHERE shopId=?', [i],function(err,res){
        if (!err) {
          exchangeRate(res[0].currencyCode,'USD',function(x){
            exchangeRate(res[0].currencyCode,'ZAR',function(y){
              var serviceFee = (parseFloat(amount) / parseFloat(x)).toFixed(0);
              cb(serviceFee,10,y,x) 
            });
          });
        }
      });
    });
  });
  socket.on('processPayment', function(paymentGateway,amount,tokenId,secretKey,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod,serviceFee,shopName,deliveryFee,distance,cb){
    if (paymentGateway=='STRIPE') {
      stripePayment(amount,tokenId,secretKey,currencyCode,function(status){
        if (status==true) {
          finalizePayment(paymentGateway,amount,tokenId,secretKey,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod,serviceFee,'PAID',shopName,deliveryFee,distance,function(res){
            cb(res)
          }); 
        }else{
          cb(status);
        }
      });
    }else if (paymentGateway=='2CHECKOUT') {
      twocheckoutPayment(amount,tokenId,secretKey,currencyCode,otherKey,function(status){
        if (status==true) {
          finalizePayment(paymentGateway,amount,tokenId,secretKey,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod,serviceFee,'PAID',shopName,deliveryFee,distance,function(res){
            cb(res)
          }); 
        }else{
          cb(status);
        }
      })
    }else if (paymentMethod=='CA') {
      finalizePayment(paymentGateway,amount,tokenId,secretKey,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod,serviceFee,'PAID',shopName,deliveryFee,distance,function(res){
        cb(res)
      }); 
    }else if (paymentMethod=='LT') {
      finalizePayment(paymentGateway,amount,tokenId,secretKey,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod,serviceFee,'NO',shopName,deliveryFee,distance,function(res){
        cb(res)
      }); 
    }else if (paymentMethod=='AC') {
      connection.query('SELECT * FROM shopsavings WHERE shopId=? AND phoneNo=?', [shopId,buyerNumber],function(err,result){
        if (result.length>0) {
          var id = result[0].id;
          var newBal = parseFloat(result[0].balance) - parseFloat(amount);
          if (newBal>=0) {
            connection.query('UPDATE shopsavings SET ? WHERE ?', [{balance:newBal},{id:id}],function(err,result){
              if (!err) {
                finalizePayment(paymentGateway,amount,tokenId,secretKey,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod,serviceFee,'PAID',shopName,deliveryFee,distance,function(res){
                  cb(res);
                }); 
              }else{
                cb(false);
              }
            });
          }else{
            cb(false)
          }
        }else{
          cb(false)
        }
      });
    }
  });
  socket.on("loadAccount", function(paymentGateway,amount,tokenId,secretKey,otherKey,shopId,currencyCode,phoneNo,cb){
    if (paymentGateway=='STRIPE') {
      stripePayment(amount,tokenId,secretKey,currencyCode,function(status){
        if (status==true) {
          loadAccount(amount,phoneNo,shopId,function(res){
            cb(res)
          });
        }else{
          cb(status);
        }
      });
    }else if (paymentGateway=='2CHECKOUT') {
      twocheckoutPayment(amount,tokenId,secretKey,currencyCode,otherKey,function(status){
        if (status==true) {
          loadAccount(amount,phoneNo,shopId,function(res){
            cb(res)
          });
        }else{
          cb(status);
        }
      })
    }
  });
  socket.on('requestForCashier', function(CashierID,amount,tokenId,secretKey,currentShopId,itemListString,loggedInUser,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod){
    io.sockets.emit('verifyCashPayment', CashierID,amount,tokenId,secretKey,currentShopId,itemListString,loggedInUser,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod);
  });
  socket.on('cash-payment-accepted', function(paymentGateway,amount,tokenId,secretKey,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod,cb){
    io.sockets.emit('cash-payment-accepted', paymentGateway,amount,tokenId,secretKey,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod);
    cb(true)
  });
  socket.on('get-my-gateways', function(shopId,cb){
    connection.query('SELECT * FROM paymentgateways WHERE shopId=?', [shopId],function(err,result){
      cb(result);
    });
  });
  socket.on('makeGateWayDefault', function(id,shopId,cb){
    connection.query('UPDATE paymentgateways SET ? WHERE ?', [{ defaultStatus: ''}, { shopId: shopId }],function(err,result){
      if (!err) {
        connection.query('UPDATE paymentgateways SET ? WHERE ?', [{ defaultStatus: 'default'}, { id: id }],function(err,result){
          if (!err) {
            cb(true)
          }
        });
      }
    });
  });
  socket.on('removeGateway', function(id,shopId,cb){
    connection.query('DELETE FROM paymentgateways WHERE id=?',[id],function(error,result){
      if (!error) {
        cb(true)
      }
    });
  });
  socket.on("addGateway", function(name,publicKey,secretKey,otherKey,shopId,cb){
    connection.query('SELECT * FROM paymentgateways WHERE name=? AND shopId=?',[name,shopId],function(error,result){
      if (result.length==0) {
        connection.query('INSERT INTO paymentgateways SET ?', {name:name,publicKey:publicKey,secretKey:secretKey,otherKey:otherKey,shopId:shopId,defaultStatus:''}, function (err, results, fields) {
          if (!err) {
            cb(true);
          }else{
            cb(false);
          }
        });
      }else{
        cb(false);
      }
    }); 
  });
  socket.on("editGateway", function(id,name,publicKey,secretKey,otherKey,shopId,cb){
    connection.query('UPDATE paymentgateways SET ? WHERE ?', [{ publicKey:publicKey,secretKey:secretKey,otherKey:otherKey}, { id: id }],function(err,result){
      if (!err) {
        cb(true)
      }else{
        cb(false);
      }
    });
  });
  socket.on("getThisShopAccountBalance", function(phoneNo,shopId,cb){
    connection.query('SELECT * FROM shopsavings WHERE shopId=? AND phoneNo=?', [shopId,phoneNo],function(err,result){
      cb(result);
    });
  });
  socket.on('changeOrderStatus', function(id,column,status,deliverer,cb){
    if (column=='status') {
      var variable = [{ status:status,deliverer:deliverer}, { id: id }]
    }else{
      var variable = [{ paidFor:status}, { id: id }]

    }
    connection.query('UPDATE payments SET ? WHERE ?', variable,function(err,result){
      if (!err) {
        cb(true);
        getIdDetails(id,deliverer);
      }else{
        cb(false);
        console.log(err)
      }
    });
    if (status=='COMPLETED') {
      topUpDriver(id);
    }else if(column=='status'){
      connection.query('SELECT * FROM payments WHERE id=?', [id],function(err,result){
        if (result.length>0) {
          var buyerNumber = result[0].buyerNumber; 
          connection.query('SELECT * FROM customers WHERE phone=?', [buyerNumber],function(err,result){
            if (result.length>0) {
              var playerId = result[0].playerId;
              notify(playerId,'ORDER '+id+' UPDATE','Just wait a little, your order is now '+status.toLowerCase()); 
            }
          });
        }
      });
    }
  });
  socket.on("driverCancelJob", function(id,phoneNo,cb){
    connection.query('UPDATE payments SET ? WHERE ?', [{ status:'READY',deliverer:'SMARTSTORE'}, { id: id }],function(err,result){
      if (!err) {
        connection.query('UPDATE drivers SET ? WHERE ?', [{status:'FREE'}, {phoneNo:phoneNo}],function(err,result){
          cb(true);
        }); 
      }else{
        cb(false);
      }
    });
  });
  socket.on("getOrdersToDeliver", function(shopId,cb){
    connection.query('SELECT * FROM payments WHERE shopId=? AND status=?', [shopId,'READY'],function(err,result){
      cb(result);
    });
  });
  socket.on("createDriverAccount", function(fname,phoneNo,driverPhotoUrl,licencePhotoUrl,frontViewUrl,sideViewUrl,transportType,latitude,longitude,makeModel,registrationNumber,countryCode,cb){
    connection.query('SELECT * FROM drivers WHERE phoneNo=?', [phoneNo],function(err,result){
      if (result.length==0) {
        connection.query('SELECT * FROM country WHERE dial_code=?',[countryCode],function(error,result){
          if (!error) {
            if (result.length>0) {
              var currencyCode = result[0].currency_code;
            }else{
              var currencyCode = 'USD';
            }
            connection.query('INSERT INTO drivers SET ?', {fname:fname,phoneNo:phoneNo,driverPhotoUrl:driverPhotoUrl,licencePhotoUrl:licencePhotoUrl,frontViewUrl:frontViewUrl,sideViewUrl:sideViewUrl,transportType:transportType,balance:'0',status:'FREE',verified:'DEMO',latitude:latitude,longitude:longitude,playerId:'',makeModel:makeModel,registrationNumber:registrationNumber,currencyCode:currencyCode}, function (err, results, fields) {
              if (!err) {
                cb(true);
              }else{
               console.log(err)
                cb(false);
              }
            });
          }
        });
      }else{
        cb(false);
      }
    });
  });
  socket.on("driver-selected", function(driverNo,id,cb){
    connection.query('UPDATE payments SET ? WHERE ?', [{ status:"READY",deliverer:"SMARTSTORE"}, { id: id }],function(err,result){
      if (!err) {
        cb(true);
      }else{
        cb(false);
        console.log(err)
      }
    });
    connection.query('SELECT * FROM payments WHERE id=?', [id],function(err,result){
      if (result.length>0) {
        var buyerNumber = result[0].buyerNumber;
        connection.query('SELECT * FROM drivers WHERE phoneNo=?', [driverNo],function(err,res){
          if (res.length>0) {
            var playerId = result[0].playerId;
            notify(playerId,'We have a job for you nearby','Hello, We have found a job for you, open your driver`s dashboard to take action');
          }
        });
        connection.query('SELECT * FROM customers WHERE phone=?', [buyerNumber],function(err,result){
          if (result.length>0) {
            var playerId = result[0].playerId;
            notify(playerId,'ORDER '+id+' UPDATE','Hi, your order has been marked as ready for collection or delivery'); 
          }
        });
      }
    });
  });
  socket.on("deleteDriverAccount", function(phoneNo,cb){
    connection.query('DELETE FROM drivers WHERE phoneNo=?',[phoneNo],function(error,result){
      if (!error) {
        cb(true)
      }else{
        cb(false);
      }
    });
  });
  socket.on("getMyDriverAccount", function(phoneNo,cb){
    connection.query('SELECT * FROM drivers WHERE phoneNo=?', [phoneNo],function(err,result){
      cb(result);
    });
  });
  socket.on("updatePayoutEmail", function(phoneNo,payoutEmail,cb){
    connection.query('UPDATE drivers SET ? WHERE ?', [{payoutEmail:payoutEmail}, {phoneNo:phoneNo}],function(err,result){
      cb(true)
    }); 
  });
  socket.on('updateDriverLocation', function(latitude,longitude,phoneNo,playerId){
    connection.query('UPDATE drivers SET ? WHERE ?', [{latitude:latitude,longitude:longitude,playerId:playerId}, {phoneNo:phoneNo}],function(err,result){});
  });
  socket.on("driverGetJob", function(latitude,longitude,phoneNo,cb){
    connection.query('SELECT *, ( 6371 * acos( cos( radians('+latitude+') ) * cos( radians( payments.latitude ) ) * cos( radians(payments.longitude) - radians('+longitude+')) + sin(radians('+latitude+')) * sin( radians(payments.latitude)))) AS distance FROM payments HAVING distance < 76 AND deliverer=? || deliverer=? AND status=? || status=? AND location=? ORDER BY distance', ['SMARTSTORE',phoneNo,'READY','PICKED','remote'],function(err,result){
      connection.query('SELECT * FROM drivers WHERE phoneNo=?', [phoneNo],function(err,res){
        cb(result,res);
      });
    });
  });
  socket.on("driverPrevJobs", function(latitude,longitude,phoneNo,cb){
    connection.query('SELECT * FROM payments WHERE deliverer=?', [phoneNo],function(err,result){
      connection.query('SELECT * FROM drivers WHERE phoneNo=?', [phoneNo],function(err,res){
        cb(result,res);
      });
    });
  });
  socket.on("driverAcceptJob", function(id,phoneNo,shopId,cb){
    connection.query('SELECT * FROM payments WHERE deliverer=? AND id=?', ['SMARTSTORE',id],function(err,result){
      if (result.length>0) {
        connection.query('UPDATE payments SET ? WHERE ?', [{deliverer:phoneNo}, {id:id}],function(err,result){
          if (!err) {
            cb(true);
            connection.query('UPDATE drivers SET ? WHERE ?', [{status:'BUSY'}, {phoneNo:phoneNo}],function(err,result){
              getShopDetails(shopId,function(res){
                notify(res[0].playerId,'A driver is coming','Your order with the ID of '+id+' has found a deliverer');
              })
            });
          }else{
            cb(false)
          }
        });
      }else{
        cb(false)
      }
    });
  });
  socket.on("driverMarkJobAsDone", function(id,buyerNumber,deliveryFee,deliverer){
    io.sockets.emit("driverMarkJobAsDone",id,buyerNumber,deliveryFee,deliverer);
    connection.query('SELECT * FROM customers WHERE phone=?', [buyerNumber],function(err,result){
      if (result.length>0) {
        var playerId = result[0].playerId;
        notify(playerId,'CONFIRM DELIVERY','Have you received order '+id+'?'); 
      }
    });
  });
  socket.on("shop-get-drivers",function(latitude,longitude,radius,cb){
    connection.query('SELECT *, ( 6371 * acos( cos( radians('+latitude+') ) * cos( radians( drivers.latitude ) ) * cos( radians(drivers.longitude) - radians('+longitude+')) + sin(radians('+latitude+')) * sin( radians(drivers.latitude)))) AS distance FROM drivers HAVING distance < 50 ORDER BY distance', [],function(err,result){
      cb(result);
    });
  });
  socket.on("buyerConfirmDelivery", function(id,deliveryFee,deliverer,cb){
    connection.query('UPDATE payments SET ? WHERE ?', [{status:'COLLECTED'}, {id:id}],function(err,result){
      if (!err) {
        cb(true);
        topUpDriver(id)
        io.sockets.emit("buyerConfirmDelivery",id,deliveryFee,deliverer);
      }else{
        cb(false)
      }
    });
  });
  socket.on("getItemsToDuplicate",function(cb){
    connection.query('SELECT * FROM shops', [],function(err,result){
      cb(result);
    });
  });
  socket.on("getItemsToDuplicateByCategory",function(category,cb){
    connection.query('SELECT * FROM shops WHERE category=?', [category],function(err,result){
      cb(result);
    });
  });
  socket.on("duplicateItems", function(copyTo,copyFrom,cb){
    connection.query('SELECT * FROM items WHERE shopId=?', [copyFrom],function(err,result){
      if (result.length>0) {
        var len = result.length;
        for (var i = 0; i < result.length; i++) {
          var itemName = result[i].itemName;
          var itemDesc = result[i].itemDesc;
          var itemBuying = result[i].itemBuying;
          var itemSelling = result[i].itemSelling;
          var itemBarcode = result[i].itemBarcode;
          var itemCategory = result[i].itemCategory;
          var timeAdded = result[i].timeAdded;
          var itemQuantity = result[i].itemQuantity;
          var shopId = result[i].shopId;
          var itemIcon = result[i].itemIcon;
          var category = result[i].category;
          var itemWeight = result[i].itemWeight;
          var smartRestaurant = result[i].smartRestaurant;
          connection.query('INSERT INTO items SET ?', {itemName:itemName, itemDesc:itemDesc, itemBuying:itemBuying, itemSelling:itemSelling, itemBarcode:itemBarcode, itemCategory:itemCategory, timeAdded:timeAdded, itemQuantity:itemQuantity, shopId:copyTo, itemWeight:itemWeight, itemIcon:itemIcon, category:category, smartRestaurant:smartRestaurant, special:'',discount:'',buyHowMany:'',getHowMany:'',specialDue:''}, function (err, results, fields) {});
          len--;
          if (len==0) {
            cb(true)
          }
        }
      }else{
        cb(false);
      }
    });
  });
  socket.on("addToSpecial", function(special,discount,buyHowMany,getHowMany,specialDue,id,shopName,shopId,latitude,longitude,cb){
    connection.query('UPDATE items SET ? WHERE ?', [{special:special,discount:discount,buyHowMany:buyHowMany,getHowMany:getHowMany,specialDue:specialDue}, {id:id}],function(err,result){
      if (!err) {
        cb(true)
        sendNotificationToCustomers(shopName,shopId,latitude,longitude,specialDue,special,discount,buyHowMany,getHowMany);
      }else{
        cb(false);
        console.log(err);
      }
    });
  });
  socket.on("removeFromSpecial", function(id,cb){
    connection.query('UPDATE items SET ? WHERE ?', [{special:'',discount:'',buyHowMany:'',getHowMany:'',specialDue:''}, {id:id}],function(err,result){
      if (!err) {
        cb(true)
      }else{
        cb(false);
      }
    });
  });
  socket.on('updateAdvanced', function(column,checkedStatus,shopId,cb){
    if (column=='remoteOrdering') {
      var variable = [{ remoteOrdering:checkedStatus}, {shopId: shopId}]
    }else if (column=='pawnBuy'){
      var variable = [{ pawnBuy:checkedStatus}, {shopId: shopId}]
    }else if (column=='smartDriver'){
      var variable = [{ smartDriver:checkedStatus}, {shopId: shopId}]
    }
    console.log("Hey "+shopId+' '+checkedStatus);
    connection.query('UPDATE shops SET ? WHERE ?', variable,function(err,result){
      if (!err) {
        cb(true);
      }else{
        cb(false);
        console.log(err)
      }
    });
  });
  socket.on("payFastWait",function(shopId,amount,location,latitude,longitude,option,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,currencyCode,service_fee,shopName,deliveryFee,distanceFromStore,cb){
    payFastWait.push({regId:shopId,amount:amount,location:location,latitude:latitude,longitude:longitude,option:option,itemListString:itemListString,buyerNumber:buyerNumber,totalBuying:totalBuying,purchaseDay:purchaseDay,totalWeight:totalWeight,currencyCode:currencyCode,service_fee:service_fee,shopName:shopName,deliveryFee:deliveryFee,distanceFromStore:distanceFromStore});
    cb(true);
  });
  socket.on("remoteScan", function(action,shopId,barcode){
    io.sockets.emit("remoteScan",action,shopId,barcode);
  });
  socket.on("payBills", function(shopId,p,activationDate,months,cb){
    connection.query('UPDATE shops SET ? WHERE ?', [{ activationDate: activationDate, package:p, months:months}, { shopId: shopId }],function(err,result){
      if (!err) {
        connection.query('UPDATE payments SET ? WHERE ?', [{ rushPaid: 'PAID'}, { shopId: shopId }],function(err,result){
          if (!err) {
            cb(true);
          }
        });
      }
    });
  });
});
function sendNotificationToCustomers(shopName,shopId,latitude,longitude,specialDue,special,discount,buyHowMany,getHowMany){
  getShopDetails(shopId,function(result){
    var operationalRadius = result[0].operationalRadius;
    connection.query('SELECT *, ( 6371 * acos( cos( radians('+latitude+') ) * cos( radians( customers.latitude ) ) * cos( radians(customers.longitude) - radians('+longitude+')) + sin(radians('+latitude+')) * sin( radians(customers.latitude)))) AS distance FROM customers HAVING distance < '+operationalRadius+'', [],function(err,result){
      var playerId=result[i].playerId;
      if (special=='DISCOUNT') {
        notify(playerId,shopName+' has a deal just for you!','Get '+discount+'% off until '+specialDue+'!');
      }else{
        notify(playerId,shopName+' has a special. Hurry!','Buy '+buyHowMany+' and get '+getHowMany+' for free until '+specialDue);
      }
    });
  });
}
function topUpDriver(id){
  connection.query('SELECT * FROM payments WHERE id=?', [id],function(err,result){
    if (result.length>0) {
      var deliverer = result[0].deliverer; 
      var deliveryFee = result[0].deliveryFee;
      if (deliverer!="SMARTSTORE" && deliverer!="OUR OWN") {
        connection.query('SELECT * FROM drivers WHERE phoneNo=?', [deliverer],function(err,result){
          if (result.length>0) {
            var playerId = result[0].playerId;
            var balance = parseFloat(result[0].balance) + parseFloat(deliveryFee); 
            connection.query('UPDATE drivers SET ? WHERE ?', [{status:'FREE',balance:balance}, {phoneNo:deliverer}],function(err,result){
              if (!err) {
                notify(playerId,'ACCOUNT TOPUP','Account topup success, Your new balance is '+parseFloat(balance).toFixed(2));
              }
            }); 
          }
        });
      }
    }
  });
}
function getIdDetails(id,deliverer){
  connection.query('SELECT * FROM payments WHERE id=?', [id],function(err,result){
    if (result.length>0) {
      var shopId = result[0].shopId;
      var shopName = result[0].shopName;
      var buyerNumber = result[0].buyerNumber;
      getDeliverers(shopId,id,deliverer,shopName);
      //getCustomerPlayerId(buyerNumber,id);
    }
  });
}
function getDeliverers(shopId,id,deliverer,shopName){
  if (deliverer=='SMARTSTORE') {
    getSmartStoreDeliverers(shopId,id,deliverer,shopName);
  }else{
    getOurOwnDeliverers(shopId,id,deliverer,shopName);
  }
}
function getSmartStoreDeliverers(shopId,id,deliverer,shopName){
  getShopDetails(shopId,function(result){
    var latitude = result[0].latitude;
    var longitude = result[0].longitude;
    connection.query('SELECT *, ( 6371 * acos( cos( radians('+latitude+') ) * cos( radians( drivers.latitude ) ) * cos( radians(drivers.longitude) - radians('+longitude+')) + sin(radians('+latitude+')) * sin( radians(drivers.latitude)))) AS distance FROM drivers HAVING distance < 51 AND status=? ORDER BY distance', ['FREE'],function(err,result){
      if (result.length>0) {
        for (var i = 0; i < result.length; i++) {
          var phoneNo = result[i].phoneNo;
          var driverLatitude = result[i].latitude;
          var driverLongitude = result[i].longitude;
          var playerId = result[i].playerId;
          var distance = getDistance(latitude,longitude,driverLatitude,driverLongitude);
          var msg = shopName+" is looking for transport. You are "+distance.toFixed(1)+"km away from the store. Open your driver`s dashboard to view this job details in full.";
          notify(playerId,'A NEW JOB FOR YOU',msg);
        }
      }
    });
  })
}
function sendSms(phoneNo,msg){
  var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  var request = new XMLHttpRequest();
  request.open('POST', 'https://rest.clicksend.com/v3/sms/send');
  request.setRequestHeader('Content-Type', 'application/json');
  request.setRequestHeader('Authorization', 'Basic bWlja3lseXJpY2Fsa2FydGVsQGdtYWlsLmNvbTo1NjE1MjBFMC04MDU5LUNCRTUtQzY5Mi1BQkVEMDdFNTRCMzI=');
  request.onreadystatechange = function () {
    if (this.readyState === 4) {
      console.log('your message was sent!')
    }
  };
  var body = {
    'messages': [
      {
        'source': 'javascript',
        'from': "smartStore",
        'body': msg,
        'to': phoneNo,
        'schedule': '',
        'custom_string': ''
      }
    ]
  };
  request.send(JSON.stringify(body));
}
function getDistance(lat1, lon1, lat2, lon2){
  var R = 6371;
  var dLat = toRad(lat2-lat1);
  var dLon = toRad(lon2-lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
  Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}
function toRad(Value) {
  return Value * Math.PI / 180;
}
function getShopDetails(shopId,cb) {
  connection.query('SELECT * FROM shops WHERE shopId=?', [shopId],function(err,result){
    cb(result);
  });
}
function getOurOwnDeliverers(shopId,id,deliverer,shopName){
  connection.query('SELECT * FROM shopusers WHERE shopId=? AND position=?', [shopId,'WAITER/WAITRESS/DELIVERER'],function(err,result){
    if (result.length>0) {
      for (var i = 0; i < result.length; i++){
        var playerId=result[i].playerId;
        notify(playerId,'DELIVERY REQUIRED','There is a new order to deliver, Open your app to check it out!');
      }
    }
  });
}
function getCustomerPlayerId(buyerNumber,id){
  connection.query('SELECT * FROM customers WHERE phone=?', [buyerNumber],function(err,result){
    if (result.length>0) {
      for (var i = 0; i < result.length; i++){
        var playerId=result[i].playerId;
        notify(playerId,'YOUR ORDER IS READY','Order '+id+' is now ready and it will be soon be delivered to you!');
      }
    }
  });
}
function notify(playerId,title,msg){
  var notification = new OneSignal.Notification({      
    headings: {en: title},
    contents: {"en": msg},
    include_player_ids: [playerId]     
  });                  
  myClient.sendNotification(notification, function (err, httpResponse,data) {      
    if (err) {      
      console.log('Something went wrong...');      
    } else {      
      console.log(data, httpResponse.statusCode);      
    }      
  });
}
function finalizePayment(paymentGateway,amount,tokenId,secretKey,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod,serviceFee,paidFor,shopName,deliveryFee,distance,cb){
  amount = (parseFloat(amount) - parseFloat(serviceFee) - parseFloat(deliveryFee));
  savePaymentDetails(amount,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,location,latitude,longitude,option,paymentMethod,serviceFee,paidFor,shopName,deliveryFee,distance,function(res){
    cb(res)
  })
}
function loadAccount(amount,phoneNo,shopId,cb){
  connection.query('SELECT * FROM shopsavings WHERE shopId=? AND phoneNo=?', [shopId,phoneNo],function(err,result){
    if (result.length>0) {
      var id = result[0].id;
      var newBal = parseFloat(amount) + parseFloat(result[0].balance);
      connection.query('UPDATE shopsavings SET ? WHERE ?', [{balance:newBal},{id:id}],function(err,result){
        if (!err) {
          cb(true)
        }else{
          cb(false);
        }
      });
    }else{
      connection.query('INSERT INTO shopsavings SET ?', {balance:amount,phoneNo:phoneNo,shopId:shopId}, function (err, results, fields) {
        if (!err) {
          cb(true);
        }else{
          cb(false);
        }
      });
    }
  });
}
function getItemWeight(itemId,shopId,cb){
  connection.query('SELECT * FROM items WHERE id=? AND shopId=?',[itemId,shopId],function(error,result){
    if (!error) {
      if (result.length>0) {
        for (var i = 0; i < result.length; i++){
          var itemWeight=result[i].itemWeight;
          var itemSelling=result[i].itemSelling;
          cb(itemWeight,itemSelling)
        }
      }
    }
  }); 
}
function getItemById(itemId,cb){
  connection.query('SELECT * FROM items WHERE id=?',[itemId],function(error,result){
    if (!error) {
      if (result.length>0) {
        for (var i = 0; i < result.length; i++){
          var itemName=result[i].itemName;
          var itemSelling=result[i].itemSelling;
          var itemBuying=result[i].itemBuying;
          cb(itemName,itemSelling,itemBuying)
        }
      }
    }
  }); 
}
function getShopName(shopId,cb){
  connection.query('SELECT * FROM shops WHERE shopId=?',[shopId],function(error,result){
    if (!error) {
      if (result.length>0) {
        for (var i = 0; i < result.length; i++){
          var shopName=result[i].shopName;
          cb(shopName)
        }
      }
    }
  });
}
function rushWalletBal(cb){
  connection.query('SELECT * FROM wallets WHERE walletId=?',['BI762412'],function(error,result){
    if (!error) {
      if (result.length>0) {
        for (var i = 0; i < result.length; i++){
          var balance=result[i].balance;
          var totalBal=result[i].fname;
          cb(balance,totalBal)
        }
      }
    }
  });
}
function savePaymentDetails(amount,shopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight,location,latitude,longitude,option,paymentMethod,serviceFee,paidFor,shopName,deliveryFee,distance,cb){
  if (location=='local' && option=='smartStore') {
    status = 'COLLECTED'
  }else{
    status = 'PLACED'
  }
  itemListString = decodeURIComponent(itemListString);
  connection.query('INSERT INTO payments SET ?', {amount:amount, shopId:shopId, itemListString:itemListString, buyerNumber:buyerNumber, initAmount:initAmount, purchaseDay:purchaseDay, verifiedBy:'', totalWeight:totalWeight, rushPaid:'No', paymentMethod:paymentMethod, serviceFee:serviceFee, latitude:latitude, longitude:longitude, location:location, paidFor:paidFor, status:status,shopName:shopName, deliverer:'', deliveryFee:deliveryFee, distanceFromStore:distance}, function (err, results, fields) {
    if (!err) {
      console.log(buyerNumber+' has paid R'+amount+' to '+shopId);
      var orderId = results.insertId;
      cb(orderId);
      updateQuantity(shopId,itemListString);
      connection.query('SELECT * FROM shops WHERE shopId=?',[shopId],function(error,result){
        if (!error) {
          if (result.length>0) {
            var shopEmail=result[0].shopEmail;
            sendEmail(shopEmail,"NEW ORDER RECEIVED","Hi "+shopName+", You have 1 new order worthy "+amount+" from "+buyerNumber+". Log in to take action!")
          }
        }else{
          console.log(error);
        }
      });
      if (status=='PLACED') {
        io.sockets.emit("newOrder",orderId,itemListString,amount,status,location,latitude,longitude,shopId,paidFor);
      }
    }else{
      console.log(err)
      cb(false);
    }
  });
}
function updateQuantity(shopId,itemListString){
  var itemListStringToArray=JSON.parse(itemListString);
  for (var i = 0; i < itemListStringToArray.length; i++){
    (function(x){
       setTimeout(function () {
          var id=itemListStringToArray[x].id;
          var quantity=itemListStringToArray[x].quantity;
          getItemQuantity(id,function(currentQuantity){
            var itemQuantity = parseFloat(currentQuantity) - parseFloat(quantity);
            connection.query('UPDATE items SET ? WHERE ?', [{ itemQuantity: itemQuantity}, { id: id }],function(err,result){
              if (!err) {
                console.log('item id '+id+' quantity was updated');
              }else{
                console.log(err)
              }
            });
          });
          mostPurchasedItems(id,function(currentQuantity){
            var itemQuantity = parseFloat(currentQuantity) + parseFloat(quantity);
            connection.query('DELETE FROM mostitems WHERE itemId=?',[id],function(error,result){});
            connection.query('INSERT INTO mostitems SET ?', {itemQuantity:itemQuantity, shopId:shopId, itemId:id}, function (err, results, fields) {
              if (!err) {
                console.log('item id '+id+' has been added to mostitems table');
              }
            });
          })
       }, 500 * i);
    })(i);
  }
}
function getItemQuantity(itemId,cb){
  connection.query('SELECT * FROM items WHERE id=?',[itemId],function(error,result){
    if (!error) {
      if (result.length>0) {
        for (var i = 0; i < result.length; i++){
          var itemQuantity=result[i].itemQuantity;
          cb(itemQuantity);
        }
      }
    }
  }); 
}
function mostPurchasedItems(itemId,cb){
  connection.query('SELECT * FROM mostitems WHERE itemId=?',[itemId],function(error,result){
    if (!error) {
      if (result.length>0) {
        for (var i = 0; i < result.length; i++){
          var itemQuantity=result[i].itemQuantity;
          cb(itemQuantity);
        }
      }else{
        cb(0)
      }
    }
  }); 
}
app.post("/uploadFile",function(req,res){
  console.log('About to upload a file');
  if (req.files) {
    console.log(req.files)
    var file=req.files.fileUrl;
    var filePath=req.body.filename;
    var categoryId=req.body.categoryId;
    var companyId=req.body.companyId;

    var itemName=req.body.itemName;
    var itemPrice=req.body.itemPrice;
    var itemQuantity=req.body.itemQuantity;
    var itemDes=req.body.itemDes;
    var url = "files/items/"+filePath;
    file.mv("./files/items/"+filePath,function(err){
      if (err) {
        console.log(err);
        res.send('Upload could not be completed')
      }else{
        saveItem(itemName,itemPrice,itemQuantity,itemDes,url,categoryId,companyId,res);
      }
    });
  }
});
app.get("/companySubscribe/:companyId/:activationTime/:activationTime/:amount/:amount/:package/:package/:month/:month/:platform/:platform",function(req,res){
  var companyId = req.params.companyId;
  var activationTime = req.params.activationTime;
  var amount = req.params.amount;
  var package = req.params.package;
  var months = req.params.month;
  var platform = req.params.platform;
  var description = 'You have selected '+package+' package for '+months+' months, Your subscription will expire after '+months+' months.';
  if ((amount!="" && amount!=null && amount!=undefined) && companyId!="") {
    var create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "https://www.smartstore.techapis.xyz/successCompany",
          "cancel_url": "https://www.smartstore.techapis.xyz/failedCompany"
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": "SMART STORE SUBSCRIPTION",
                  "sku": 'sku',
                  "price": amount,
                  "currency": "USD",
                  "quantity": 1
              }]
          },
          "amount": {"currency": "USD","total": amount},
          "description": description,
      }]
    };
    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        console.log(error);
        console.log(error.response.details)
      } else {
        var paymentID = payment.id;
        for(let i=0; i<payment.links.length; i++){
          if (payment.links[i].rel=='approval_url') {
            res.redirect(payment.links[i].href);
            removeObj(waitingUsers,companyId);
            waitingUsers.push({regId:companyId, amount:amount, paymentID:paymentID, activationTime:activationTime, firstRes:res, package:package, months:months, platform:platform})
          }
        }
      }
    });
  }else{
    res.send('Please login to continue!');
  }
});
app.get("/successCompany",function(req,res){
  var payerId = req.query.PayerID;
  var paymentId = req.query.paymentId;
  for (var i = 0; i < waitingUsers.length; i++){
    var paymentID=waitingUsers[i].paymentID;
    var amount=waitingUsers[i].amount;
    if (paymentID==paymentId) {
      var execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
            "currency": "USD",
            "total": amount
            }
        }]
      };
      paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
          console.log(error.response);
          throw error;
        } else {
          for (var i = 0; i < waitingUsers.length; i++){
            paymentId = payment.id;
            var paymentID=waitingUsers[i].paymentID;
            var shopId=waitingUsers[i].regId;
            var activationDate=waitingUsers[i].activationTime;
            var package=waitingUsers[i].package;
            var months=waitingUsers[i].months;
            var platform=waitingUsers[i].platform;
            if (paymentID==paymentId) {
              companySubscribed(shopId,activationDate,res,package,months,platform);
              console.log('The payment was success for '+shopId);
              waitingUsers=[];
            }
          }
        }
      });
    }
  }
});
function companySubscribed(shopId,activationDate,res,p,months,platform){
  connection.query('UPDATE shops SET ? WHERE ?', [{ activationDate: activationDate, package:p, months:months}, { shopId: shopId }],function(err,result){
    if (!err) {
      connection.query('UPDATE payments SET ? WHERE ?', [{ rushPaid: 'PAID'}, { shopId: shopId }],function(err,result){
        if (!err) {
          if (platform=="web") {
            res.redirect("https://smartstoreweb.net/dashboard/#!/#payment-success-page");
          }else{
            res.redirect("https://www.smartstoreweb.net/paymentSuccess");
          }
        }
      });
    }else{
      console.log(err)
      if (platform=="web") {
        res.redirect("https://smartstoreweb.net/dashboard/#!/#payment-error-page");
      }else{
        res.redirect("https://www.smartstoreweb.net/paymentError");
      }
    }
  });
}
app.get("/failedCompany",function(req,res){
  res.send("You cancelled your subscription process!");
});
function removeObj(data,id){
  for(var i = 0; i < data.length; i++) {
    if(data[i].regId == id) {
      data.splice(i, 1);
      break;
    }
  }
}
function sendPushAndSms(){
  var time = (60*1000*60)*9;
  setTimeout(function(){
    var updateArray=['notnow','update'];
    var randomSelect = updateArray[Math.floor(Math.random() * updateArray.length)];
    var messages = ['Your account was suspended and you could lose potential buyers. Subscribe now.',
    'Save as many lives in your community by selling online. Stop the spread of coronavirus!', 
    'Every life is precious. Help save lives by selling online.',
    'Do you sell drinks? Someone is looking for drinks in bulk. Login to view the order.',
    'Why choose to strugle with stock taking while we are here for you? Let us handle your business for you.',
    'Other businesses are generating huge revenues through us even during this crisis?',
    'Have you ever tried placing any of your goods on specials? Try it now.',
    'Hi, Did you know we have helped 1000s stores just like yours to make it through our AI stock management feature which helps you to easily find best products for your store?',
    'Dear Admin, Your business helps your community a lot and its time for us to help you too. Subscribe now to start operating.',
    'Together we can save lives, Let your customers buy from the store they already trust.']
    if (randomSelect=='update') {
      connection.query('SELECT * FROM shops', [],function(err,result){
        result.forEach(function(item, i) {
          var activationDate = result[i].activationDate;
          var staffPhone = result[i].staffPhone;
          var playerId = result[i].playerId;
          var p = result[i].package;
          var months = result[i].months;
          if(p=='TRIAL'){
            var daysToOperate = 7;
          }else{
            var daysToOperate = 30 * parseInt(months)
          }
          var dailyMills = 1000 * 60 * 60 * 24;
          var daysSpent =  ((Date.now() - parseFloat(activationDate)) / dailyMills).toFixed(0);
          if (daysSpent>daysToOperate) {
            sendAlert(staffPhone,playerId,messages);
          }
        });
      });
    }
  },time)
}
function sendAlert(staffPhone,playerId,messages){
  var sms = [false,false,false,false];
  var msg = messages[Math.floor(Math.random() * messages.length)];
  var sendWithSms = sms[Math.floor(Math.random() * sms.length)];
  var titles = ['1000s OF PEOPLE ARE WAITING','LET YOUR CUSTOMERS FEEL SAFE','DON`T KEEP THEM WAITING','SAVE LIVES BY SELLING ONLINE','COVID-19 IS DEADLY STAY HOME, SELL ONLINE'];
  var title = titles[Math.floor(Math.random() * titles.length)];
  if (sendWithSms==true) {
    request('https://mymobileapi.com/api5/http5.aspx?Type=sendparam&username=Betterdaystech1&password=liciousr&numto='+staffPhone+'&data1='+msg, function(error, response, body) {
      console.log(body)
    });
  }
  var notification = new OneSignal.Notification({      
    headings: {en: title},
    contents: {"en": msg},
    include_player_ids: [playerId]     
  });                  
  myClient.sendNotification(notification, function (err, httpResponse,data) {      
    if (err) {      
      console.log('Something went wrong...');      
    } else {      
      console.log(data, httpResponse.statusCode);      
    }      
  });
}
app.use('/files',require("express").static(__dirname + '/freenetserver'));
http.listen(9000, function() {
  console.log("Listening on 9000");
  sendPushAndSms();
  connection.getConnection(function(err,conn){  
    if (!!err) {
      console.log("database Access Denied "+err);
    }else{
      conn.release();
      console.log("database Access granted");
    }
  });
  mkdirp('./files/items', function (err) {
   if (err) console.error(err)
   else console.log('directory files was created');
  });
});
function sendEmail(toEmail,subject,msg){
  var nodemailer = require('nodemailer');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  var transporter = nodemailer.createTransport({
    host: 'premium91.web-hosting.com',
    auth: {
      user: 'no-reply@smartstoreweb.net',
      pass: '7624TROXXy!'
    }
  });

  var mailOptions = {
    from: 'no-reply@smartstoreweb.net',
    to: toEmail,
    subject: subject,
    text: msg
  };
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}
function getServiceAvailable(to,shopId,cb){
  var base = 'USD_'+to;
  request('https://free.currconv.com/api/v7/convert?q='+base+'&compact=ultra&apiKey=734c25e1335310bec110', function(error, response, body) {
    if (!error) {
      if (body.includes('503')) {
        var serviceFee = 2;
      }else{
        var serviceFee = (parseFloat(JSON.parse(body)[base]) / 6).toFixed(2);
      }
    }else{
      var serviceFee = 2;
    }
    connection.query('SELECT * FROM paymentgateways WHERE shopId=? AND defaultStatus=?', [shopId,'default'],function(err,result){
      if (!err) {
        /*connection.query('SELECT * FROM paymentgateways WHERE shopId=? AND name=? OR name=?', [shopId,'PAYPAL','PAYFAST'],function(err,paypalRes){
          cb(serviceFee,result,paypalRes);
        });*/
        connection.query('SELECT * FROM paymentgateways WHERE shopId='+mysql.escape(shopId)+' AND (name='+mysql.escape('PAYPAL')+' OR name='+mysql.escape('PAYFAST')+')',function(err,paypalRes){
          cb(serviceFee,result,paypalRes);
        });
      }
    });
  });
}
function stripePayment(amount,tokenId,secretKey,currencyCode,cb){
  var stripe = require('stripe')(secretKey);
  amount = parseFloat(amount) * 100;
  var charge = stripe.charges.create({
    amount:amount,
    currency:currencyCode,
    source:tokenId
  },function(err,charge){
    if (err && err.type ==="StripeCardError") {
      console.log('Card error, could not complete the payment!');
      cb(false);
    }else{
      console.log('A successful purchase was done.......');
      cb(true);
    }
  })
}
function twocheckoutPayment(amount,tokenId,secretKey,currencyCode,otherKey,cb){
  var tco = new Twocheckout({
    sellerId: otherKey,
    privateKey: secretKey
    //demo:false,
    //sandbox: true
  });
  var params = {
    "merchantOrderId": Date.now(),
    "token": tokenId,
    "currency": currencyCode,
    "total": amount,
    "billingAddr": {
      "name": "Micky Ndhlovu",
      "addrLine1": "123 Test St",
      "city": "Johannesburg",
      "state": "Gauteng",
      "zipCode": "1811",
      "country": "RSA",
      "email": "mickytroxxy@gmail.com",
      "phoneNumber": "0735711170"
    }
};
  tco.checkout.authorize(params, function (error, data) {
    if (error) {
      console.log(error.message);
      cb(false);
    }else {
      cb(true);
    }
  });
}

app.get('/paypalProcess/:currentShopId/:secretKey/:secretKey/:publicKey/:publicKey/:amount/:amount/:location/:location/:latitude/:latitude/:longitude/:longitude/:option/:option/:itemListString/:itemListString/:loggedInUser/:loggedInUser/:totalBuying/:totalBuying/:purchaseDay/:purchaseDay/:totalWeight/:totalWeight/:currencyCode/:currencyCode/:serviceFee/:serviceFee/:currentShopName/:currentShopName/:deliveryFee/:deliveryFee/:distanceFromStore/:distanceFromStore',function(req,res){
  var shopId = req.params.currentShopId;
  var secretKey = req.params.secretKey;
  var amount = req.params.amount;
  var publicKey = req.params.publicKey;
  var location = req.params.location;
  var latitude = req.params.latitude;
  var longitude = req.params.longitude;
  var option = req.params.option;
  var itemListString = req.params.itemListString;
  var loggedInUser = req.params.loggedInUser;
  var totalBuying = req.params.totalBuying;
  var purchaseDay = req.params.purchaseDay;
  var totalWeight = req.params.totalWeight;
  var currencyCode = req.params.currencyCode;
  //var serviceFee = req.params.serviceFee;
  var shopName = req.params.currentShopName;
  var deliveryFee = req.params.deliveryFee;
  var distance = req.params.distanceFromStore;
  var description = 'You are paying for your items';
  getServiceAvailable(currencyCode,shopId,function(serviceFee,result,paypalRes){
      var amountInUSD = (parseFloat(amount) / (parseFloat(serviceFee) * 4)).toFixed(0);
      var paypalCustom = require('paypal-rest-sdk');
      paypalCustom.configure({
        'mode': 'live', //sandbox or live
        'client_id': publicKey,
        'client_secret': secretKey
      });
      if ((amount!="" && amount!=null && amount!=undefined) && shopId!="") {
        var create_payment_json = {
          "intent": "sale",
          "payer": {
              "payment_method": "paypal"
          },
          "redirect_urls": {
              "return_url": "https://www.smartstore.techapis.xyz/successUser",
              "cancel_url": "https://www.smartstore.techapis.xyz/failedUser"
          },
          "transactions": [{
              "item_list": {
                  "items": [{
                      "name": "SMART STORE PAYMENT",
                      "sku": 'sku',
                      "price": amountInUSD,
                      "currency": "USD",
                      "quantity": 1
                  }]
              },
              "amount": {"currency": "USD","total": amountInUSD},
              "description": description,
          }]
        };
        paypalCustom.payment.create(create_payment_json, function (error, payment) {
          if (error) {
            console.log(error);
            console.log(error.response.details)
          } else {
            var paymentID = payment.id;
            for(let i=0; i<payment.links.length; i++){
              if (payment.links[i].rel=='approval_url') {
                res.redirect(payment.links[i].href);
                removeObj(waitingUsers,loggedInUser);
                waitingUsers.push({regId:shopId,amount:amount,paymentID:paymentID,location:location,firstRes:res,latitude:latitude,longitude:longitude,option:option,itemListString:itemListString,buyerNumber:loggedInUser,totalBuying:totalBuying,purchaseDay:purchaseDay,totalWeight:totalWeight,serviceFee:serviceFee,amountInUSD:amountInUSD,secretKey:secretKey,publicKey:publicKey,shopName:shopName,deliveryFee:deliveryFee,distance:distance});
              }
            }
          }
        });
      }else{
        res.send('Please login to continue!');
      }
  })

});
app.get("/successUser",function(req,res){
  var paypalCustom = require('paypal-rest-sdk');
  var payerId = req.query.PayerID;
  var paymentId = req.query.paymentId;
  for (var i = 0; i < waitingUsers.length; i++){
    var paymentID=waitingUsers[i].paymentID;
    var amountInUSD=waitingUsers[i].amountInUSD;
    var secretKey=waitingUsers[i].secretKey;
    var publicKey=waitingUsers[i].publicKey;
    if (paymentID==paymentId) {
      var execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
            "currency": "USD",
            "total": amountInUSD
            }
        }]
      };
      paypalCustom.configure({'mode': 'live','client_id': publicKey,'client_secret': secretKey});
      paypalCustom.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
          console.log(error.response);
          throw error;
        } else {
          for (var i = 0; i < waitingUsers.length; i++){
            paymentId = payment.id;
            var paymentID=waitingUsers[i].paymentID;
            var shopId=waitingUsers[i].regId;
            var amount=waitingUsers[i].amount;
            var location=waitingUsers[i].location;
            var latitude=waitingUsers[i].latitude;
            var longitude=waitingUsers[i].longitude;
            var option=waitingUsers[i].option;
            var itemListString=waitingUsers[i].itemListString;
            var buyerNumber=waitingUsers[i].buyerNumber;
            var totalBuying=waitingUsers[i].totalBuying;
            var purchaseDay=waitingUsers[i].purchaseDay;
            var totalWeight=waitingUsers[i].totalWeight;
            var serviceFee=waitingUsers[i].serviceFee;
            var shopName=waitingUsers[i].shopName;
            var deliveryFee=waitingUsers[i].deliveryFee;
            var distance=waitingUsers[i].distance;
            if (paymentID==paymentId) {
              amount = (parseFloat(amount) - parseFloat(serviceFee) - parseFloat(deliveryFee));
              savePaymentDetails(amount,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,location,latitude,longitude,option,'PP',serviceFee,'PAID',shopName,deliveryFee,distance,function(cb){
                if (cb==true) {
                  if (option=="website") {
                    res.redirect("https://smartstoreweb.net/dashboard/#!/#payment-success-page");
                  }else{
                    res.redirect("https://www.smartstoreweb.net/paymentSuccess");
                  }
                }else{
                  if (option=="website") {
                    res.redirect("https://smartstoreweb.net/dashboard/#!/#payment-error-page");
                  }else{
                    res.redirect("https://www.smartstoreweb.net/paymentError");
                  }
                }
              })
            }
          }
        }
      });
    }
  }
});
app.get("/failedUser",function(req,res){
  res.redirect("https://www.smartstoreweb.net/paymentError");
});
app.get('/payFastSuccess',function(req,res){
  res.redirect("https://www.smartstoreweb.net/paymentSuccess");
});
app.get('/payFastCancelled',function(req,res){
  res.redirect("https://www.smartstoreweb.net/paymentError");
});
app.get('/payFastSuccessWeb/:userBuying',function(req,res){
  var userBuying = req.params.userBuying;
  for (var i = 0; i < payFastWait.length; i++){
    var shopId=payFastWait[i].regId;
    var amount=payFastWait[i].amount;
    var location=payFastWait[i].location;
    var latitude=payFastWait[i].latitude;
    var longitude=payFastWait[i].longitude;
    var option=payFastWait[i].option;
    var itemListString=payFastWait[i].itemListString;
    var buyerNumber=payFastWait[i].buyerNumber;
    var totalBuying=payFastWait[i].totalBuying;
    var purchaseDay=payFastWait[i].purchaseDay;
    var totalWeight=payFastWait[i].totalWeight;
    var serviceFee=payFastWait[i].service_fee;
    var shopName=payFastWait[i].shopName;
    var deliveryFee=payFastWait[i].deliveryFee;
    var distance=payFastWait[i].distanceFromStore;
    if (buyerNumber==userBuying) {
      amount = (parseFloat(amount) - parseFloat(serviceFee) - parseFloat(deliveryFee));
      savePaymentDetails(amount,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,location,latitude,longitude,option,'PF',serviceFee,'PAID',shopName,deliveryFee,distance,function(cb){
        if (cb==true) {
          res.redirect("https://smartstoreweb.net/dashboard/#!/#payment-success-page");
        }else{
          res.redirect("https://smartstoreweb.net/dashboard/#!/#payment-error-page");
        }
      })
    }
  }
});
app.get('/payFastFailedWeb/:userBuying',function(req,res){
  res.redirect("https://smartstoreweb.net/dashboard/#!/#payment-error-page");
});
app.post("/upload",function(req,res){
  console.log("now uploading files");
  if (req.files) {
    var file=req.files.fileUrl;
    var filePath=req.body.filePath;
    file.mv("./"+filePath,function(err){
      if (err) {
        console.log(err);
      }else{
        res.send("success");
        console.log('file upload success.......')
      }
    });
  }
});
function exchangeRate(currencyCode,base,cb){
  request('https://api.exchangeratesapi.io/latest?symbols='+currencyCode+'&base='+base, function(error, response, body) {
    cb(JSON.parse(body).rates[currencyCode],currencyCode);
  });
}
//mickytroxxy empireDigitals1!@


[opensips-1]
 log_level: WARNING
 prompt_name: opensips-cli
 prompt_intro: Welcome to OpenSIPS at SECUREVOIP
 prompt_emptyline_repeat_cmd: False
 history_file: ~/.opensips-cli.history
 history_file_size: 1000
 output_type: pretty-print
 communication_type: fifo
 fifo_file: /tmp/opensips_fifo
 database_schema_path: /usr/src/opensips-3.0/scripts/mysql
 database_url: mysql://root:7624TROXXy!@localhost
 database_name: opensips