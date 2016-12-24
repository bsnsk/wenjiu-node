var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export default async function userResponses(req, res, next) {
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
  res.send(new APIResponse(true, "fetch user responses", {
    "content": rows
  }));
}
