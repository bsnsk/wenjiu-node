var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export default async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var request_id = parseInt(req.params.request_id);

  if (!typecheck.check(request_id, "int")) {
    typecheck.report(res);
    return;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    'SELECT publisher_id, status FROM available_requests WHERE request_id=?;',
    [request_id],
    conn.release()
  );
  if (rows.length == 0)
    res.send(new APIResponse(false, "request not found"));
  else if (rows.length > 1)
    res.send(new APIResponse(false,
      "request id has duplicates (probably a server error)"));
  else if (userid != parseInt(rows[0]['publisher_id']))
    res.send(new APIResponse(false,
      "this request cannot be deleted unless by its publisher"));
  else if (rows[0]['status'] == 'deleted')
    res.send(new APIResponse(false,
      "request already deleted"));
  else {
    let conn = await alchpool.getConnection();
    let [rows, fields] = await conn.execute(
      "UPDATE `available_requests` SET `status` = 'deleted'" +
      "WHERE request_id=?",
      [request_id],
      conn.release()
    );
    res.send(new APIResponse(true, "request deleted successfully."));
  }
}
