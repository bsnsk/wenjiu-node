var express = require('express');
var typecheck = require('../helpers/typecheck');
var idgenerator = require('../helpers/idgenerator');
var userAuth = require('../helpers/userAuth').authenticate;
var router = express.Router();

/*
 * [POST] User Registration
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


  db.query("SELECT userid FROM all_users WHERE username=?;", [username],
    async (err, rows, fields) => {
    if (err) {
      console.log(err);
      return;
    }

    if (rows.length > 0)
      res.send(JSON.stringify({
        "status": "failure",
        "message": "username existing"
      }));
    else {
      var id = await idgenerator.genInt('user');
      db.query(
        "INSERT INTO all_users (`userid`, `username`, `passwordhash`) "
        + "VALUES (?, ?, ?);",
        [id, username, password],
        (err, rows, fields) => {
          if (err) {
            console.log(err);
            return;
          }
          res.send(JSON.stringify({
            "status": "success",
            "message": "user registration"
          }));
        });
    }
  });
});

/*
 * [GET] View a list of requests 
 */
router.get('/requests', userAuth, (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var db = require('../helpers/db').alchpool;
  db.query(
    'SELECT * FROM available_requests ' +
    'WHERE publisher_id=? ' +
    'ORDER BY end_time DESC ' + 
    'LIMIT 20;',
    [userid],
    (err, rows, fields) => {
      if (err) {
        console.log(err);
        return;
      }
      res.send(JSON.stringify({
        "status": "success",
        "message": "fetch user requests",
        "content": rows 
      }));
    }
  );
});

/*
 * [GET] View a list of responses
 */
router.get('/responses', userAuth, (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var db = require('../helpers/db').alchpool;
  db.query(
    'SELECT * FROM available_responses ' +
    'WHERE actor_id=? ' +
    'ORDER BY push_time DESC ' + 
    'LIMIT 20;',
    [userid],
    (err, rows, fields) => {
      if (err) {
        console.log(err);
        return;
      }
      res.send(JSON.stringify({
        "status": "success",
        "message": "fetch user responses",
        "content": rows 
      }));
    }
  );
});

/* 
 * [GET] Get public information of a user 
 */
router.get('/:user_id', userAuth, (req, res, next) => {
  var user_id = parseInt(req.params.user_id);
  if (!typecheck.check(user_id, "int")) {
    typecheck.report(res);
    return;
  }
  var db = require('../helpers/db').alchpool;
  db.query(
    `SELECT 
      username, 
      nickname, 
      gender, 
      signature, 
      figure_id, 
      rating, 
      disabled 
    FROM all_users 
    WHERE userid=?`,
    [user_id],
    async (err, rows, fields) => {
      if (err) {
        console.log(err);
        return;
      }
      if (rows.length == 0)
        res.send(JSON.stringify({
          "status": "failure",
          "message": "user not found"
        }));
      else if (rows.length > 1)
        res.send(JSON.stringify({
          "status": "failure",
          "message": "user id has duplicates (probably a server error)"
        }));
      else {
        res.send(JSON.stringify({
          "status": "success",
          "message": "user fetched",
          "content": rows[0]
        }));
      }
    }
  );
});

/*
 * [PUT] Update User Profile 
 */
router.put('/:user_id', userAuth, (req, res, next) => {
  var user_id = parseInt(req.params.user_id);
  var actor_id = parseInt(req.headers.userid);
  var infoStrings = [];
  var subjects = ['gender', 'figure_id', 'nickname', 'signature'];
  var subject_type = ['string', 'int', 'string', 'string'];

  console.log({"update user": user_id, "by": actor_id, "info": req.body});

  for (var i=0; i<subjects.length; i++)
    if (req.body[subjects[i]] != undefined) {
      if (subject_type[i] != 'string')
        infoStrings.push(subjects[i] + '=' + req.body[subjects[i]])
      else 
        infoStrings.push(subjects[i] + "='" + req.body[subjects[i]] + "'")
    }

  var setupString = infoStrings.join(',');
  console.log(setupString);

  if (!typecheck.check(user_id, "int")
    || user_id != actor_id) {
      typecheck.report(res);
      return;
  }

  var db = require('../helpers/db').alchpool;
  db.query(
    ` UPDATE all_users
      SET `
        + setupString +
    ` WHERE userid=?;`,
    [user_id],
    (err, rows, fields) => {
      if (err) {
        console.log(err);
        return;
      }
      res.send(JSON.stringify({
          "status": "success",
          "message": "user profile updated"
      }));
    }
  );

});

module.exports = router;
