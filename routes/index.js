var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";
var sha256 = require('sha256');
var randomstring = require("randomstring");


/* GET home page. */
router.get('/users', async function(req, res, next) {
  var db = await MongoClient.connect(url);
  var username = await req.query.user
  var query = { username: username };
  console.log(query)
  var mydb = db.db("mydb");
  var result = await mydb.collection("user_preferences").find(query).toArray();
  res.send(result[0])
  console.log(result[0])
  
});
router.get('/save', async function(req, res, next) {
  var db = await MongoClient.connect(url);
  var data = await req.query.data;
  var username = await req.query.username;
  data = {$set:JSON.parse(data)}
  var mydb = db.db("mydb")
  var myquery = {username : username}

  mydb.collection("user_preferences").updateOne(myquery,data,function(err, res) {
    if (err) throw err;
    console.log("1 document updated");
    db.close();
  });
  res.send("1 document updated");
  
});

router.get('/signin', async function(req, res, next) {
  var db = await MongoClient.connect(url);
  var username = await req.query.username;
  var password = await req.query.password;
  var mydb = db.db("mydb")
  var data = await mydb.collection("authen").find({username:username}).toArray();
  var salt = data[0].salt;
  var actual_hash = data[0].hash;
  var in_hash = await sha256(password+salt);
  console.log((actual_hash===in_hash)?"Successful logged in!":"Failed")
  var to_send = (actual_hash===in_hash) ? "1" : "0";
  res.send(to_send)
});

router.get('/signup', async function(req, res, next) {
  
  var username = await req.query.username;
  var password = await req.query.password;
  var re_password = await req.query.re_password;
  

  if(password===re_password){
    var db = await MongoClient.connect(url);
    var mydb = db.db("mydb")
    var data = await mydb.collection("authen").find({username:username}).toArray();
    console.log(data)
    if(data.length===0){
      var salt = await randomstring.generate({length: 5})
      var hash = await sha256(password+salt)
      await mydb.collection("authen").insert({
        username : username,
        salt : salt,
        hash : hash
      })
      await mydb.collection("user_preferences").insert({
        username:username,
        language : 0,
        timezone : 0,
        currency : 0,
        visibility : 0,
        message : 0,
        content : 0,
        status : 0
      })
      console.log("Register successful!")
      res.send({res:1,message:"Register successful!"})
    }else{
      console.log("Already have this username!")
      res.send({res:0,message:"Already have this username!"})
    }
  }else{
    console.log("Password are not the same!")
    res.send({res:0,message:"Password are not the same!"})
  }
});


module.exports = router;
