var express = require('express');
var idgenerator = require('../idgenerator');
var typecheck = require('../typecheck');
var userAuth = require('../userAuth').authenticate;
var router = express.Router();

/*
 * [GET] View a list of requests 
 */
router.get('/', userAuth, async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var token = req.headers.token;
  var db = require('../db').alchpool;
  db.query(
    'SELECT * FROM available_requests ' +
    'WHERE status IS NULL ' +
    'ORDER BY end_time DESC ' + 
    'LIMIT 20;',
    (err, rows, fields) => {
      if (err) {
        console.log(err);
        return;
      }
      res.send(JSON.stringify({
        "status": "success",
        "message": "fetch recent requests",
        "content": rows 
      }));
    }
  );
});

/* 
 * [GET] View a request 
 */
router.get('/:request_id', userAuth, async (req, res, next) => {
  var request_id = parseInt(req.params.request_id);
  var userid = parseInt(req.headers.userid);
  var token = req.headers.token;
  if (!typecheck.check(request_id, "int")) {
    typecheck.report(res);
    return;
  }
  var db = require('../db').alchpool;
  db.query(
    'SELECT * FROM available_requests WHERE request_id=?',
    [request_id],
    (err, rows, fields) => {
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
      else res.send(JSON.stringify({
        "status": "success",
        "message": "request fetched successfully.",
        "content": rows[0]
      }));
  });
});


/* 
 * [DELETE] Delete a request 
 */
router.delete('/:request_id', userAuth, async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var token = req.headers.token;
  var request_id = parseInt(req.params.request_id);

  if (!typecheck.check(request_id, "int")) {
    typecheck.report(res);
    return;
  }

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
});


/*
 * [POST] Publish a request 
 */
router.post('/', userAuth, async (req, res, next) => {
  var db = require('../db').alchpool;
  var userid = parseInt(req.headers.userid);
  var token = req.headers.token;
  var title = req.body.title;
  var text = req.body.text;
  var end_time = req.body.finishtime;

  if (!typecheck.check(title, "string")
    || !typecheck.check(text, "string")) {
    typecheck.report(res);
    return;
  }

  console.log({"publish request" : {"userid": userid, "token": token}});

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
  db.query(
    'INSERT INTO available_requests (' +
      '`request_id`,' + 
      '`title`, ' +
      '`text`, ' +
      '`creation_time`, ' +
      '`end_time`, ' +
      '`publisher_id`' +
    ') VALUES (?, ?, ?, ?, ?, ?)',
    request_info,
    (err, rows, fields) => {
      if (err) {
        console.log(err);
        return;
      }
      res.send(JSON.stringify({
        "status": "success",
        "message": "request published",
        "requestid": id.toString()
      }));
    }
  );
});

module.exports = router;
