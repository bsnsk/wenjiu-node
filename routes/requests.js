var express = require('express');
var idgenerator = require('../idgenerator');
var typecheck = require('../typecheck');
var mysql = require('mysql2/promise');
var mysqlconf = require('../.conf.json').mysql;
var router = express.Router();

/*
 * [GET] View a list of requests 
 */
router.get('/', async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var token = req.headers.token;
  let conn = await mysql.createConnection(mysqlconf);

  if (!typecheck.check(userid, "int")
    || !typecheck.check(token, "string")) {
    typecheck.report(res);
    return;
  }

  let [rows, fields] = await conn.execute(
    'SELECT userid, token FROM valid_tokens WHERE userid=?;',
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
      'SELECT * FROM available_requests ' +
      'WHERE status IS NULL ' +
      'ORDER BY end_time DESC ' + 
      'LIMIT 20;');
    res.send(JSON.stringify({
      "status": "success",
      "message": "fetch recent requests",
      "content": rows 
    }));
  }
});

/* 
 * [GET] View a request 
 */
router.get('/:request_id', async (req, res, next) => {
  var request_id = parseInt(req.params.request_id);
  var userid = parseInt(req.headers.userid);
  var token = req.headers.token;
  let conn = await mysql.createConnection(mysqlconf);
  if (!typecheck.check(userid, "int")
    || !typecheck.check(token, "string")
    || !typecheck.check(request_id, "int")) {
    typecheck.report(res);
    return;
  }
  let [rows, fields] = await conn.execute(
    'SELECT userid, token FROM valid_tokens WHERE userid=?;',
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
      'SELECT * FROM available_requests WHERE request_id=?',
      [request_id]
    );
    if (rows.length == 0)
      res.send(JSON.stringify({
        "status": "failure",
        "message": "request not found"
      }));
    else if (rows.length > 1)
      res.send(JSON.stringify({
        "status": "failure",
        "message": "request id has duplicates (probably a server error)"
      }));
    else res.send(JSON.stringify({
      "status": "success",
      "message": "request fetched successfully.",
      "content": rows[0]
    }));
  }
});


/* 
 * [DELETE] Delete a request 
 */
router.delete('/:request_id', async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var token = req.headers.token;
  var request_id = parseInt(req.params.request_id);
  let conn = await mysql.createConnection(mysqlconf);

  if (!typecheck.check(request_id, "int")
    || !typecheck.check(userid, "int")
    || !typecheck.check(token, "string")) {
    typecheck.report(res);
    return;
  }

  let [rows, fields] = await conn.execute(
    'SELECT userid, token FROM valid_tokens WHERE userid=?;',
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
    var db = require('../db').alchpool;
    db.query('SELECT publisher_id, status FROM available_requests WHERE request_id=?;',
      [request_id],
      (err, rows, fields) => {
        console.log(rows);
        if (err) {
          console.log(err);
          return;
        }
        if (rows.length == 0)
          res.send(JSON.stringify({
            "status": "failure",
            "message": "request not found"
          }));
        else if (rows.length > 1)
          res.send(JSON.stringify({
            "status": "failure",
            "message": "request id has duplicates (probably a server error)"
          }));
        else if (userid != parseInt(rows[0]['publisher_id']))
          res.send(JSON.stringify({
            "status": "failure",
            "message": "this request cannot be deleted unless by its publisher"
          }));
        else if (rows[0]['status'] == 'deleted')
          res.send(JSON.stringify({
            "status": "failure",
            "message": "request already deleted"
          }));
        else {
          db.query("UPDATE `available_requests` SET `status` = 'deleted'" +
            "WHERE request_id=?", [request_id], (err, rows, fields) => {
              if (err)
                console.log(err);
            });
          res.send(JSON.stringify({
            "status": "success",
            "message": "request deleted successfully.",
            "content": rows[0]
          }));
        }
      });
  }
});


/*
 * [POST] Publish a request 
 */
router.post('/', async (req, res, next) => {
  let db = await mysql.createConnection(mysqlconf);
  var userid = parseInt(req.headers.userid);
  var token = req.headers.token;
  var title = req.body.title;
  var text = req.body.text;
  var end_time = req.body.finishtime;

  if (!typecheck.check(userid, "int") 
    || !typecheck.check(token, "string")
    || !typecheck.check(title, "string")
    || !typecheck.check(text, "string")) {
    typecheck.report(res);
    return;
  }

  console.log({"publish request" : {"userid": userid, "token": token}});

  let [rows, fields] = await db.execute(
    'SELECT userid, token FROM valid_tokens WHERE userid=?;',
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
    let id = await idgenerator.genInt('request');
    let request_info = 
      [
        id,
        title,
        text,
        Date.now(),
        Date.parse(end_time),
        userid,
      ];
    let [rows, fields] = await db.execute(
      'INSERT INTO available_requests (' +
        '`request_id`,' + 
        '`title`, ' +
        '`text`, ' +
        '`creation_time`, ' +
        '`end_time`, ' +
        '`publisher_id`' +
      ') VALUES (?, ?, ?, ?, ?, ?)',
      request_info
    );
    res.send(JSON.stringify({
      "status": "success",
      "message": "request published",
      "requestid": id.toString()
    }));
  }

});

module.exports = router;
