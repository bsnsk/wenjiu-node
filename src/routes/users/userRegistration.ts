var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';
import {genInt as genId} from '../../helpers/idgenerator';

export default async function userRegistration(req, res, next) {
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
    res.send(new APIResponse(false, "username existing"));
  else {
    var id: number = await genId('user');
    let [rows, fields ] = await conn.execute(
      "INSERT INTO all_users (`userid`, `username`, `passwordhash`) "
      + "VALUES (?, ?, ?);",
      [id, username, password]
    );
    res.send(new APIResponse(true, "user registration"));
  }
  conn.release();
}
