var typecheck = require('./typecheck');
var alchpool = require('./db').alchpool;
import APIResponse from './APIresponse';

module.exports = {
  authenticate: async (req, res, next) => {
    var userid = parseInt(req.headers.userid);
    var token = req.headers.token;

    if (!typecheck.check(userid, "int")
      || !typecheck.check(token, "string")) {
      typecheck.report(res);
      return;
    }
    console.log({'into authentication': alchpool});

    let conn = await alchpool.getConnection();
    let [rows, fields] = await conn.execute(
      'SELECT userid, token FROM valid_tokens WHERE userid=?;',
      [userid],
      conn.release()
    );

    var found: boolean = false;
    for (var i=0; i<rows.length; i++)
      if (rows[i]['token'] == token) {
        found = true;
        break;
      }
    if (!found)
      res.send(new APIResponse(false, "user not logged in or invalid token"));
    else next();
  }
};
