var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export default async (req, res, next) => {
  var request_id = parseInt(req.params.request_id);
  var userid = parseInt(req.headers.userid);
  if (!typecheck.check(request_id, "int")) {
    typecheck.report(res);
    return;
  }
  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    'SELECT ' +
      'r.request_id, ' +
      'u.nickname, ' +
      'u.figure_id, ' +
      'u.userid, ' +
      "' ' AS title, " +
      'r.text, ' +
      'r.creation_time, ' +
      'r.end_time ' +
    'FROM available_requests r ' +
    'JOIN all_users u ' +
      'ON r.request_id = ? ' +
      'AND r.publisher_id = u.userid;',
    [request_id]
  );
  if (rows.length == 0) {
    res.send(new APIResponse(false, "request not found"));
    conn.release();
  }
  else if (rows.length > 1) {
    res.send(new APIResponse(false,
      "request id has duplicates (probably a server error)"));
    conn.release();
  }
  else {
    let [rows2, fields2] = await conn.execute(
      ` SELECT
          r.response_id,
          u.figure_id,
          u.nickname,
          r.creation_time,
          r.num_likes,
          IF (
            CHARACTER_LENGTH(r.text) > 30,
            CONCAT(LEFT(r.text, 30), '...'),
            r.text
          ) AS text
        FROM available_responses r
        JOIN all_users u
          ON request_id = ?
          AND u.userid = r.actor_id;
      `,
      [rows[0]['request_id']]
    );
    let [rows3, fields3] = await conn.execute(
      'SELECT multimedia_id FROM request_multimedia WHERE request_id=?',
      [rows[0]['request_id']],
      conn.release()
    );
    res.send(new APIResponse(true, "request fetched successfully.", {
      "content": {
                  "request_meta": rows[0],
                  "multimedia": rows3,
                  "responses": rows2
                }
    }));
  }
}
