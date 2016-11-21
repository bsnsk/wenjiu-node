var express = require('express');
var idgenerator = require('../helpers/idgenerator');
var typecheck = require('../helpers/typecheck');
var userAuth = require('../helpers/userAuth').authenticate;
var mysql = require('mysql2/promise');
var mysqlconf = require('../.conf.json').mysql;
var router = express.Router();

/*
 * [GET] View a response 
 */
router.get('/:response_id', userAuth, async (req, res, next) => {
  var response_id = parseInt(req.params.response_id);
  if (!typecheck.check(response_id, "int")) {
    typecheck.report(res);
    return;
  }
  var db = require('../helpers/db').alchpool;
  db.query(
    'SELECT ' +
      'r.response_id, ' +
      'r.request_id, ' +
      'u.nickname, ' +
      'u.figure_id, ' +
      'u.userid, ' +
      'r.text, ' +
      'r.creation_time, ' +
      'r.push_time ' +
    'FROM available_responses r ' +
    'JOIN all_users u ' +
      'ON r.actor_id=u.userid ' +
      'AND r.response_id=?;',
    [response_id], 
    async (err, rows, fields) => {
      if (err) {
        console.log(err);
        return;
      }
      if (rows.length == 0)
        res.send(JSON.stringify({
          "status": "failure",
          "message": "response not found"
        }));
      else if (rows.length > 1)
        res.send(JSON.stringify({
          "status": "failure",
          "message": "response id has duplicates (probably a server error)"
        }));
      else {
        let conn = await mysql.createConnection(mysqlconf);
        let [mrows, mfields] = await conn.execute(
          'SELECT multimedia_id FROM response_multimedia WHERE response_id=?;',
          [rows[0]['response_id']]
        );
        res.send(JSON.stringify({
          "status": "success",
          "message": "response fetched successfully.",
          "content": {
                      "response_content": rows[0],
                      "multimedia": mrows
                    }
        }));
      }
    }
  );
});

/*
 * [DELETE] Delete a response 
 */
router.delete('/:response_id', userAuth, (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var response_id = parseInt(req.params.response_id);

  if (!typecheck.check(response_id, "int")) {
    typecheck.report(res);
    return;
  }

  var db = require('../helpers/db').alchpool;
  db.query(
    'SELECT actor_id, status FROM available_responses ' +
    'WHERE response_id=?;',
    [response_id],
    (err, rows, fields) => {
      if (err) {
        console.log(err);
        return;
      }
      if (rows.length == 0)
        res.send(JSON.stringify({
          "status": "failure",
          "message": "response not found"
        }));
      else if (rows.length > 1)
        res.send(JSON.stringify({
          "status": "failure",
          "message": "response id has duplicates (probably a server error)"
        }));
      else if (userid != parseInt(rows[0]['actor_id']))
        res.send(JSON.stringify({
          "status": "failure",
          "message": "this response cannot be deleted unless by its publisher"
        }));
      else if (rows[0]['status'] == 'deleted')
        res.send(JSON.stringify({
          "status": "failure",
          "message": "response already deleted"
        }));
      else {
        db.query("UPDATE `available_responses` SET `status` = 'deleted'" +
          "WHERE response_id=?", [response_id], (err, rows, fields) => {
            if (err)
              console.log(err);
            res.send(JSON.stringify({
              "status": "success",
              "message": "response deleted successfully.",
            }));
          }
        );
      }
    }
  );
});

/*
 * [POST] Publish a response
 */
router.post('/', userAuth, async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var request_id = parseInt(req.body.request_id);
  var text = req.body.text;
  var multimedia = JSON.parse(req.body.multimedia);

  if (!typecheck.check(text, "string")
    || !typecheck.check(request_id, "int")) {
    typecheck.report(res);
    return;
  }

  console.log(req.body);
  let db = await mysql.createConnection(mysqlconf);
  let [rows, fields] = await db.execute(
    'SELECT request_id, end_time FROM available_requests WHERE ' +
    'request_id=?;',
    [request_id]
  );
  if (rows.length == 0)
    res.send(JSON.stringify({
      "status": "failure",
      "message": "invalid request id"
    }));
  else if (rows.length > 1)
    res.send(JSON.stringify({
      "status": "failure",
      "message": "duplicate request id"
    }))
  else {
    let response_id = await idgenerator.genInt('response');
    await db.execute(
      'INSERT INTO available_responses ( ' +
        '`response_id`, ' +
        '`actor_id`, ' +
        '`request_id`, ' +
        '`text`, ' +
        '`creation_time`, ' +
        '`push_time`' +
      ') VALUES (?, ?, ?, ?, ?, ?);',
      [
        response_id,
        userid,
        request_id,
        text,
        Date.now(),
        rows[0]['end_time'],
      ]
    );
    for (var i=0; i<multimedia.length; i++) {
      await db.execute(
        'INSERT INTO response_multimedia (' +
          '`response_id`, ' +
          '`multimedia_id` ' +
        ') VALUES (?,?);',
        [
          response_id.toString(),
          multimedia[i]
        ]
      );
    }
    res.send(JSON.stringify({
      "status": "success",
      "message": "response published",
      "responseid": response_id.toString()
    }));
  }
});

module.exports = router;
