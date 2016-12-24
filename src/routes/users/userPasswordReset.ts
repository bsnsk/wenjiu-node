var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export default async function userPasswordReset(req, res, next) {
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
    res.send(new APIResponse(false, "request not found"));
  else if (rows.length > 1)
    res.send(new APIResponse(false, "request id has duplicates (probably a server error)"));
  else if (rows[0]['passwordhash'] != oldPassword)
    res.send(new APIResponse(false, "old password incorrect"));
  else {
    let [rows, fields] = await conn.execute(
      ` UPDATE all_users
        SET passwordhash=?
        WHERE userid=?;`,
      [newPassword, user_id]
    );
    res.send(new APIResponse(true, "user password changed"));
  }
  conn.release();
}
