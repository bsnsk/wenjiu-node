var express = require('express');
var jwt = require('jsonwebtoken');
var userconf = require('../.users.json');
var typecheck = require('../helpers/typecheck');
var router = express.Router();

/*
 * [POST] User login 
 */
router.post('/', (req, res, next) => {

  var db = require('../helpers/db').alchpool;
  var username = req.body.username;
  var password = req.body.password;

  if (!typecheck.check(username, "string") 
    || !typecheck.check(password, "string")) {
    typecheck.report(res);
    return;
  }

  console.log({"user_login": {"username": username, "password": password}});

  db.query("SELECT userid, passwordhash FROM all_users WHERE username=?;",
      [username], (err, rows, fields) => {

    if (err) {
      console.log(err);
      return;
    }

    console.log(rows);

    if (rows.length > 1)
      res.send(JSON.stringify({
        "status": "failure",
        "message": "multiple users with this name"
      }))
    else if (rows.length == 0)
        res.send(JSON.stringify({
          "status": "failure",
          "message": "username not found"
        }))
    else if (rows[0]['passwordhash'] == password){ 

      console.log({"timestamp": new Date()});

      var token = jwt.sign({
        "username": username,
        "userid": rows[0]['userid'],
        "timestamp": new Date()
      },  userconf['private_key']);
      db.query("INSERT INTO valid_tokens (`userid`, `token`) VALUES (?, ?);",
        [rows[0]['userid'].toString(), token],
        (err, rows, fields) => {
          if (err) {
            console.log(err);
            return;
          }
        });
        res.send(JSON.stringify({
          "status": "success",
          "message": "login",
          "userid": rows[0]['userid'],
          "token": token 
        }));
    }
    else if (rows[0]['passwordhash'] != password)
        res.send(JSON.stringify({
          "status": "failure",
          "message": "incorrect password"
        }))
    else
        res.send(JSON.stringify({
          "status": "failure",
          "message": "unknown reason"
        }))
  });
});

/*
 * [DELETE] User logout
 */
router.delete('/', (req, res, next) => {
  var db = require('../helpers/db').alchpool;
  var userid = parseInt(req.headers.userid);
  var token = req.headers.token;

  console.log({"logout" : {"userid": userid, "token": token}});

  db.query("SELECT userid, token FROM valid_tokens WHERE userid=?;",
    [userid], (err, rows, fields) => {

    if (err) {
      console.log(err);
      return;
    }

    console.log(rows);

    var found = 0;
    for (var i=0; i<rows.length; i++)
      if (rows[i]['token'] == token) {
        found = 1;
        break;
      }
    if (found == 0)
      res.send(JSON.stringify({
       "status": "failure",
       "message": "user not logged in"
      }))
    else {
      db.query("DELETE FROM valid_tokens WHERE userid=? AND token=?;",
        [userid, token], (err, rows, fields) => {
        if (err) {
          console.log(err);
        }
      });
      res.send(JSON.stringify({
        "status": "success",
        "message": "user logout"
      }));
    }
  });
});
module.exports = router;
