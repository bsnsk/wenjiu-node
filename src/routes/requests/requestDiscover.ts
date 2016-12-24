var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export default async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var cursorCreationTime = req.query.last_time;
  var creationTimeFilter;

  if (cursorCreationTime == undefined
    || isNaN(parseInt(cursorCreationTime)) )
    creationTimeFilter = "";
  else {
    var cursorInt = parseInt(cursorCreationTime);
    creationTimeFilter = `AND r.creation_time < ${cursorInt}`;
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
      r.end_time
    FROM available_requests r
    JOIN all_users u
    ON
      r.status IS NULL
      AND r.publisher_id = u.userid
      AND r.end_time > ?
      AND r.publisher_id <> ?
  ` + creationTimeFilter +
  ` ORDER BY r.creation_time DESC
    LIMIT 20;`,
    [Date.now(), userid],
    conn.release()
  );
  res.send(new APIResponse(true, "fetch recent requests", {"content": rows}));
}
