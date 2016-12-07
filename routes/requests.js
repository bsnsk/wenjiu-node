var express = require('express');
var idgenerator = require('../helpers/idgenerator');
var typecheck = require('../helpers/typecheck');
var userAuth = require('../helpers/userAuth').authenticate;
var alchpool = require('../helpers/db').alchpool;
var router = express.Router();

/*
 * [GET] View a list of requests 
 */
router.get('/', userAuth, async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var cursorCreationTime = req.query.last_time;
  var creationTimeFilter;

  if (cursorCreationTime == undefined 
    || isNaN(parseInt(cursorCreationTime)) )
    creationTimeFilter = "";
  else {
    var cursorInt = parseInt(cursorCreationTime);
    creationTimeFilter = `AND r.creation_time < ${cursorInt}`;
  }

  console.log({'creation time filter': creationTimeFilter});
  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
  ` SELECT
      r.request_id,
      u.nickname,
      u.figure_id,
      IF (
        CHARACTER_LENGTH(r.title) > 30, 
        CONCAT(LEFT(r.title, 30), '...'),
        r.title
      ) AS title,
      ' ' AS text,
      r.creation_time,
      r.end_time
    FROM available_requests r
    JOIN all_users u 
    ON 
      r.status IS NULL
      AND r.publisher_id = u.userid
      AND r.end_time > ?
  ` + creationTimeFilter +
  ` ORDER BY r.creation_time DESC 
    LIMIT 20;`,
    [Date.now()],
    conn.release()
  );
  res.send(JSON.stringify({
    "status": "success",
    "message": "fetch recent requests",
    "content": rows 
  }));
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
  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    'SELECT ' +
      'r.request_id, ' +
      'u.nickname, ' +
      'u.figure_id, ' +
      'u.userid, ' +
      'r.title, ' +
      'r.text, ' +
      'r.creation_time, ' +
      'r.end_time ' +
    'FROM available_requests r ' +
    'JOIN all_users u ' +
      'ON r.request_id = ? ' +
      'AND r.publisher_id = u.userid;',
    [request_id]
  );
  if (rows.length == 0) {
    res.send(JSON.stringify({
      "status": "failure",
      "message": "request not found"
    }));
    conn.release();
  }
  else if (rows.length > 1) {
    res.send(JSON.stringify({
      "status": "failure",
      "message": "request id has duplicates (probably a server error)"
    }));
    conn.release();
  }
  else {
    let [rows2, fields2] = await conn.execute(
      ` SELECT
          r.response_id,
          u.figure_id,
          u.nickname,
          r.creation_time,
          IF (
            CHARACTER_LENGTH(r.text) > 30, 
            CONCAT(LEFT(r.text, 30), '...'),
            r.text
          ) AS text
        FROM available_responses r
        JOIN all_users u
          ON request_id = ?
          AND u.userid = r.actor_id;
      `,
      [rows[0]['request_id']]
    );
    let [rows3, fields3] = await conn.execute(
      'SELECT multimedia_id FROM request_multimedia WHERE request_id=?',
      [rows[0]['request_id']],
      conn.release()
    );
    res.send(JSON.stringify({
      "status": "success",
      "message": "request fetched successfully.",
      "content": {
                  "request_meta": rows[0],
                  "multimedia": rows3,
                  "responses": rows2 
                }
    }));
  }
});


/* 
 * [DELETE] Delete a request 
 */
router.delete('/:request_id', userAuth, async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var request_id = parseInt(req.params.request_id);

  if (!typecheck.check(request_id, "int")) {
    typecheck.report(res);
    return;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    'SELECT publisher_id, status FROM available_requests WHERE request_id=?;',
    [request_id],
    conn.release()
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
    let conn = await alchpool.getConnection();
    let [rows, fields] = await conn.execute(
      "UPDATE `available_requests` SET `status` = 'deleted'" +
      "WHERE request_id=?", 
      [request_id],
      conn.release()
    ); 
    res.send(JSON.stringify({
      "status": "success",
      "message": "request deleted successfully.",
    }));
  }
});


/*
 * [POST] Publish a request 
 */
router.post('/', userAuth, async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var title = req.body.title;
  var text = req.body.text;
  var end_time = req.body.endtime;
  var multimedia;
  
  if (req.body.multimedia != undefined)
    multimedia = JSON.parse(req.body.multimedia);

  console.log(req.body);
  if (!typecheck.check(title, "string")
    || !typecheck.check(text, "string")
    || !typecheck.check(end_time, "int")
    || end_time <= Date.now()) {
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
      end_time,
      userid,
    ];
  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
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
  if (multimedia != undefined)
  for (var i=0; i<multimedia.length; i++) {
    let [rows, fields] = await conn.execute(
      'INSERT INTO request_multimedia (' +
        '`request_id`, ' +
        '`multimedia_id` ' +
      ') VALUES (?,?)',
      [
        id.toString(),
        multimedia[i]
      ]
    );
  }
  res.send(JSON.stringify({
    "status": "success",
    "message": "request published",
    "requestid": id.toString()
  }));
  conn.release();
});

module.exports = router;
