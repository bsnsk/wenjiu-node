var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export default async (req, res, next) => {
  var response_id = parseInt(req.params.response_id);
  if (!typecheck.check(response_id, "int")) {
    typecheck.report(res);
    return;
  }
  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    'SELECT ' +
      'r.response_id, ' +
      'r.request_id, ' +
      'u.nickname, ' +
      'u.figure_id, ' +
      'u.userid, ' +
      'r.text, ' +
      'r.creation_time, ' +
      'r.push_time, ' +
      'r.num_likes ' +
    'FROM available_responses r ' +
    'JOIN all_users u ' +
      'ON r.actor_id=u.userid ' +
      'AND r.response_id=?;',
    [response_id]
  );
  if (rows.length == 0)
    res.send(new APIResponse(false, "response not found"));
  else if (rows.length > 1)
    res.send(new APIResponse(false, "response id has duplicates (probably a server error)"));
  else {
    let [mrows, mfields] = await conn.execute(
      'SELECT multimedia_id FROM response_multimedia WHERE response_id=?;',
      [rows[0]['response_id']]
    );
    res.send(new APIResponse(true, "response fetched successfully.", {
      "content": {
                  "response_content": rows[0],
                  "multimedia": mrows
                }
    }));
  }
  conn.release();
}
