var express = require('express');
var typecheck = require('../typecheck');
var idgenerator = require('../idgenerator');
var router = express.Router();

/*
 * [POST] User Registration
 */
router.post('/', (req, res, next) => {

  var db = require('../db').alchpool;
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

module.exports = router;
