var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export default async function userHistoryGet(req, res, next) {
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
    `(SELECT
        'request' AS item_type,
        r.request_id AS item_id,
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
    `)

    UNION ALL

    (SELECT
        'response' AS item_type,
        r.response_id AS item_id,
        u.nickname,
        u.figure_id,
        ' ' AS title,
        IF (
          CHARACTER_LENGTH(r.text) > 100,
          CONCAT(LEFT(r.text, 100), '...'),
          r.text
        ) AS text,
        r.creation_time,
        r.push_time AS end_time,
        r.status
      FROM available_responses r
      JOIN all_users u
      ON
        r.actor_id = ?
        AND r.actor_id = u.userid
    ` + creationTimeFilter +
    `)

      ORDER BY creation_time DESC
      LIMIT 20;
    `,
    [userid, userid],
    conn.release()
  );
  res.send(new APIResponse(true, "fetch user requests", {
    "content": rows
  }));
}
