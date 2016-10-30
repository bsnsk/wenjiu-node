var typecheck = require('./typecheck');

module.exports = {
  authenticate: (req, res, next) => {
    var userid = parseInt(req.headers.userid);
    var token = req.headers.token;

    if (!typecheck.check(userid, "int")
      || !typecheck.check(token, "string")) {
      typecheck.report(res);
      return;
    }

    var db = require('./db').alchpool;
    db.query(
      'SELECT userid, token FROM valid_tokens WHERE userid=?;',
      [userid],
      (err, rows, fields) => {
        if (err) {
          console.log(err);
          return;
        }

        var found = 0;
        for (var i=0; i<rows.length; i++)
          if (rows[i]['token'] == token) {
            found = 1;
            break;
          }
        if (found == 0)
          res.send(JSON.stringify({
           "status": "failure",
           "message": "user not logged in or invalid token"
          }))
        else next();
      }
    );
  }
};
