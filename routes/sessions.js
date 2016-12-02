var express = require('express');
var jwt = require('jsonwebtoken');
var userconf = require('../.users.json');
var typecheck = require('../helpers/typecheck');
var alchpool = require('../helpers/db').alchpool;
var router = express.Router();

/*
 * [POST] User login 
 */
router.post('/', async (req, res, next) => {

  var username = req.body.username;
  var password = req.body.password;

  if (!typecheck.check(username, "string") 
    || !typecheck.check(password, "string")) {
    typecheck.report(res);
    return;
  }

  console.log({"user_login": {"username": username, "password": password}});

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
      'SELECT userid, passwordhash, nickname, figure_id ' +
      'FROM all_users WHERE username=?;',
      [username]
  );
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

    let [rows, fields] = await conn.execute(
      "INSERT INTO valid_tokens (`userid`, `token`) VALUES (?, ?);",
      [rows[0]['userid'].toString(), token]
    );
    res.send(JSON.stringify({
      "status": "success",
      "message": "login",
      "userid": rows[0]['userid'],
      "token": token,
      "nickname": rows[0]['nickname'],
      "figure_id": rows[0]['figure_id']
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
  conn.release();
});

/*
 * [DELETE] User logout
 */
router.delete('/', async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var token = req.headers.token;

  console.log({"logout" : {"userid": userid, "token": token}});

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    "SELECT userid, token FROM valid_tokens WHERE userid=?;",
    [userid]
  );
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
    let [rows, fields] = await conn.execute(
      "DELETE FROM valid_tokens WHERE userid=? AND token=?;",
      [userid, token]
    );
    res.send(JSON.stringify({
      "status": "success",
      "message": "user logout"
    }));
  }
  conn.release();
});
module.exports = router;
