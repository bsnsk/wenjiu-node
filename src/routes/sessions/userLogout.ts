var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export default async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var token = req.headers.token;

  console.log({"logout" : {"userid": userid, "token": token}});

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    "DELETE FROM valid_tokens WHERE userid=? AND token=?;",
    [userid, token]
  );
  res.send(new APIResponse(true, "user logout"));
  conn.release();
}
