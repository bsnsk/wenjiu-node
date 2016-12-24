var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export default async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var response_id = parseInt(req.params.response_id);

  if (!typecheck.check(response_id, "int")) {
    typecheck.report(res);
    return;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    'SELECT actor_id, status FROM available_responses ' +
    'WHERE response_id=?;',
    [response_id]
  );
  if (rows.length == 0)
    res.send(new APIResponse(false, "response not found"));
  else if (rows.length > 1)
    res.send(new APIResponse(false, "response id has duplicates (probably a server error)"));
  else if (userid != parseInt(rows[0]['actor_id']))
    res.send(new APIResponse(false, "this response cannot be deleted unless by its publisher"));
  else if (rows[0]['status'] == 'deleted')
    res.send(new APIResponse(false, "response already deleted"));
  else {
    let [rows, fields] = await conn.execute(
      "UPDATE `available_responses` SET `status` = 'deleted'" +
      "WHERE response_id=?",
      [response_id]
    );
    res.send(new APIResponse(true, "response deleted successfully."));
  }
  conn.release();
}
