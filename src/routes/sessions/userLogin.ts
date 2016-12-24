var jwt = require('jsonwebtoken');
var userconf = require('../../../.users.json');
var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export default async (req, res, next) => {

  var username = req.body.username;
  var password = req.body.password;

  if (!typecheck.check(username, "string")
    || !typecheck.check(password, "string")) {
    typecheck.report(res);
    return;
  }

  console.log({"user_login": {"username": username, "password": password}});

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
      ` SELECT
          userid,
          passwordhash,
          nickname,
          gender,
          signature,
          figure_id
        FROM all_users
        WHERE username=?;
      `,
      [username]
  );
  if (rows.length > 1)
    res.send(new APIResponse(false, "multiple users with this name"));
  else if (rows.length == 0)
    res.send(new APIResponse(false, "username not found"));
  else if (rows[0]['passwordhash'] == password){

    var token = jwt.sign({
      "username": username,
      "userid": rows[0]['userid'],
      "timestamp": new Date()
    },  userconf['private_key']);

    await conn.execute(
      "INSERT INTO valid_tokens (`userid`, `token`) VALUES (?, ?);",
      [rows[0]['userid'].toString(), token]
    );
    res.send(new APIResponse(true, "login", {
      "userid": rows[0]['userid'],
      "token": token,
      "nickname": rows[0]['nickname'],
      "gender": rows[0]['gender'],
      "signature": rows[0]['signature'],
      "figure_id": rows[0]['figure_id']
    }));
  }
  else if (rows[0]['passwordhash'] != password)
    res.send(new APIResponse(false, "incorrect password"));
  else
    res.send(new APIResponse(false, "unknown reason"));
  conn.release();
}
