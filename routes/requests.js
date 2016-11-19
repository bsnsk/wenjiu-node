var express = require('express');
var idgenerator = require('../helpers/idgenerator');
var typecheck = require('../helpers/typecheck');
var userAuth = require('../helpers/userAuth').authenticate;
var mysql = require('mysql2/promise');
var mysqlconf = require('../.conf.json').mysql;
var router = express.Router();

/*
 * [GET] View a list of requests 
 */
router.get('/', userAuth, (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var db = require('../helpers/db').alchpool;
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
  if (!typecheck.check(request_id, "int")) {
    typecheck.report(res);
    return;
  }
  var db = require('../helpers/db').alchpool;
  db.query(
    'SELECT * FROM available_requests WHERE request_id=?',
    [request_id],
    async (err, rows, fields) => {
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
      else {
        let db = await mysql.createConnection(mysqlconf);
        let [rows2, fields2] = await db.execute(
          'SELECT response_id, actor_id, creation_time FROM available_responses WHERE request_id=?',
          [rows[0]['request_id']]
        );
        res.send(JSON.stringify({
          "status": "success",
          "message": "request fetched successfully.",
          "content": {
                      "request_meta": rows[0],
                      "responses": rows2 
                    }
        }));
      }
  });
});


/* 
 * [DELETE] Delete a request 
 */
router.delete('/:request_id', userAuth, (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var request_id = parseInt(req.params.request_id);

  if (!typecheck.check(request_id, "int")) {
    typecheck.report(res);
    return;
  }

  var db = require('../helpers/db').alchpool;
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
            res.send(JSON.stringify({
              "status": "success",
              "message": "request deleted successfully.",
            }));
          });
      }
    });
});


/*
 * [POST] Publish a request 
 */
router.post('/', userAuth, async (req, res, next) => {
  var db = require('../helpers/db').alchpool;
  var userid = parseInt(req.headers.userid);
  var title = req.body.title;
  var text = req.body.text;
  var end_time = req.body.endtime;

  if (!typecheck.check(title, "string")
    || !typecheck.check(text, "string")) {
    typecheck.report(res);
    return;
  }

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
