var express = require('express');
var typecheck = require('../helpers/typecheck');
var idgenerator = require('../helpers/idgenerator');
var userAuth = require('../helpers/userAuth').authenticate;
var alchpool = require('../helpers/db').alchpool;
var router = express.Router();

/*
 * [POST] User Registration
 */
router.post('/', async (req, res, next) => {

  var username = req.body.username;
  var password = req.body.password;

  if (!typecheck.check(username, "string")
    || !typecheck.check(password, "string")) {
    typecheck.report(res);
    return;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    "SELECT userid FROM all_users WHERE username=?;",
    [username]
  );
  if (rows.length > 0)
    res.send(JSON.stringify({
      "status": "failure",
      "message": "username existing"
    }));
  else {
    var id = await idgenerator.genInt('user');
    let [rows, fields ] = await conn.execute(
      "INSERT INTO all_users (`userid`, `username`, `passwordhash`) "
      + "VALUES (?, ?, ?);",
      [id, username, password]
    );
    res.send(JSON.stringify({
      "status": "success",
      "message": "user registration"
    }));
  }
  conn.release();
});

/*
 * [GET] View a list of requests
 */
router.get('/requests', userAuth, async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var cursorCreationTime = req.query.last_time;
  var creationTimeFilter;
  if (cursorCreationTime == undefined
    || isNaN(parseInt(cursorCreationTime)))
    creationTimeFilter = "";
  else {
    var cursorInt = parseInt(cursorCreationTime);
    creationTimeFilter = `AND creation_time < ${cursorInt}`;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    ` SELECT
        r.request_id,
        u.nickname,
        u.figure_id,
        ' ' AS title,
        IF (
          CHARACTER_LENGTH(r.text) > 100,
          CONCAT(LEFT(r.text, 100), '...'),
          r.text
        ) AS text,
        r.creation_time,
        r.end_time,
        r.status
      FROM available_requests r
      JOIN all_users u
      ON
        r.publisher_id = ?
        AND r.publisher_id = u.userid
    ` + creationTimeFilter +
    ` ORDER BY r.creation_time DESC
      LIMIT 20;
    `,
    [userid],
    conn.release()
  );
  res.send(JSON.stringify({
    "status": "success",
    "message": "fetch user requests",
    "content": rows
  }));
});

/*
 * [GET] View a list of requests and responses of a certain user,
 *      which will be presented at the user profile page as highlights.
 */
router.get('/:userid/highlights', userAuth, async (req, res, next) => {
  var userid = parseInt(req.params.userid);
  var cursorCreationTime = req.query.last_time;
  var creationTimeFilter;
  if (cursorCreationTime == undefined
    || isNaN(parseInt(cursorCreationTime)))
    creationTimeFilter = "";
  else {
    var cursorInt = parseInt(cursorCreationTime);
    creationTimeFilter = `AND r.creation_time < ${cursorInt}`;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    ` SELECT
        'response' AS item_type,
        r.response_id AS item_id,
        u.nickname AS nickname,
        u.figure_id AS figure_id,
        '' AS title,
        IF (
          CHARACTER_LENGTH(r.text) > 100,
          CONCAT(LEFT(r.text, 100), '...'),
          r.text
        ) AS text,
        r.creation_time AS creation_time,
        r.push_time AS end_time,
        r.num_likes AS num_likes
      FROM available_responses r
      JOIN all_users u
      ON
        r.actor_id = ?
        AND r.actor_id = u.userid
        AND r.push_time < ?
    ` + creationTimeFilter +
    ` ORDER BY r.num_likes DESC , r.creation_time DESC
      LIMIT 50;
    `,
    [userid, Date.now()],
    conn.release()
  );
  res.send(JSON.stringify({
    "status": "success",
    "message": "fetch user highlights",
    "content": rows
  }));
});
/*
 * [GET] View a list of requests and responses
 */
router.get('/history', userAuth, async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var cursorCreationTime = req.query.last_time;
  var creationTimeFilter;
  if (cursorCreationTime == undefined
    || isNaN(parseInt(cursorCreationTime)))
    creationTimeFilter = "";
  else {
    var cursorInt = parseInt(cursorCreationTime);
    creationTimeFilter = `AND creation_time < ${cursorInt}`;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    `(SELECT
        'request' AS item_type,
        r.request_id AS item_id,
        u.nickname,
        u.figure_id,
        ' ' AS title,
        IF (
          CHARACTER_LENGTH(r.text) > 100,
          CONCAT(LEFT(r.text, 100), '...'),
          r.text
        ) AS text,
        r.creation_time,
        r.end_time,
        r.status
      FROM available_requests r
      JOIN all_users u
      ON
        r.publisher_id = ?
        AND r.publisher_id = u.userid
    ` + creationTimeFilter +
    `)

    UNION ALL

    (SELECT
        'response' AS item_type,
        r.response_id AS item_id,
        u.nickname,
        u.figure_id,
        ' ' AS title,
        IF (
          CHARACTER_LENGTH(r.text) > 100,
          CONCAT(LEFT(r.text, 100), '...'),
          r.text
        ) AS text,
        r.creation_time,
        r.push_time AS end_time,
        r.status
      FROM available_responses r
      JOIN all_users u
      ON
        r.actor_id = ?
        AND r.actor_id = u.userid
    ` + creationTimeFilter +
    `)

      ORDER BY creation_time DESC
      LIMIT 20;
    `,
    [userid, userid],
    conn.release()
  );
  res.send(JSON.stringify({
    "status": "success",
    "message": "fetch user requests",
    "content": rows
  }));
});

/*
 * [GET] View a list of responses
 */
router.get('/responses', userAuth, async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    'SELECT * FROM available_responses ' +
    'WHERE actor_id=? ' +
    'ORDER BY push_time DESC ' +
    'LIMIT 20;',
    [userid],
    conn.release()
  );
  res.send(JSON.stringify({
    "status": "success",
    "message": "fetch user responses",
    "content": rows
  }));
});

/*
 * [GET] Get public information of a user
 */
router.get('/:user_id', userAuth, async (req, res, next) => {
  var user_id = parseInt(req.params.user_id);
  if (!typecheck.check(user_id, "int")) {
    typecheck.report(res);
    return;
  }
  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
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
    conn.release()
  );
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
});

/*
 * [PUT] Update User Profile
 */
router.put('/:user_id', userAuth, async (req, res, next) => {
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

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    ` UPDATE all_users
      SET `
        + setupString +
    ` WHERE userid=?;`,
    [user_id],
    conn.release()
  );
  res.send(JSON.stringify({
      "status": "success",
      "message": "user profile updated"
  }));
});

/*
 * [POST] Reset password
 */
router.post('/:user_id/reset_password', userAuth, async (req, res, next) => {
  var user_id = parseInt(req.params.user_id);
  var actor_id = parseInt(req.headers.userid);
  var oldPassword = req.body['old_password'];
  var newPassword = req.body['new_password'];

  console.log(`password change for user ${user_id} by ${actor_id}`);

  if (!typecheck.check(user_id, "int")
    || user_id != actor_id) {
      typecheck.report(res);
      return;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    ` SELECT
        passwordhash
      FROM all_users
      WHERE userid=?;`,
    [user_id]
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
  else if (rows[0]['passwordhash'] != oldPassword)
    res.send(JSON.stringify({
      "status": "failure",
      "message": "Old password incorrect"
    }));
  else {
    console.log('old password verified');
    let [rows, fields] = await conn.execute(
      ` UPDATE all_users
        SET passwordhash=?
        WHERE userid=?;`,
      [newPassword, user_id]
    );
    res.send(JSON.stringify({
      "status": "success",
      "message": "user password changed"
    }));
  }
  conn.release();
});

module.exports = router;
