var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export default async function userRequests(req, res, next) {
  var userid: number = parseInt(req.headers.userid);
  var cursorCreationTime = req.query.last_time;
  var creationTimeFilter: string;
  if (cursorCreationTime == undefined
    || isNaN(parseInt(cursorCreationTime)))
    creationTimeFilter = "";
  else {
    var cursorInt: number = parseInt(cursorCreationTime);
    creationTimeFilter = `AND creation_time < ${cursorInt}`;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    ` SELECT
        r.request_id,
        u.nickname,
        u.figure_id,
        ' ' AS title,
        IF (
          CHARACTER_LENGTH(r.text) > 100,
          CONCAT(LEFT(r.text, 100), '...'),
          r.text
        ) AS text,
        r.creation_time,
        r.end_time,
        r.status
      FROM available_requests r
      JOIN all_users u
      ON
        r.publisher_id = ?
        AND r.publisher_id = u.userid
    ` + creationTimeFilter +
    ` ORDER BY r.creation_time DESC
      LIMIT 20;
    `,
    [userid],
    conn.release()
  );
  res.send(new APIResponse(true, "fetch user requests", {
    "content": rows
  }));
}
