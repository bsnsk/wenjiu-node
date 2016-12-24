var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export default async function userHighlightsGet(req, res, next) {
  var userid: number = parseInt(req.params.userid);
  var cursorCreationTime = req.query.last_time;
  var creationTimeFilter: string;
  if (cursorCreationTime == undefined
    || isNaN(parseInt(cursorCreationTime)))
    creationTimeFilter = "";
  else {
    var cursorInt: number = parseInt(cursorCreationTime);
    creationTimeFilter = `AND r.creation_time < ${cursorInt}`;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    ` SELECT
        'response' AS item_type,
        r.response_id AS item_id,
        u.nickname AS nickname,
        u.figure_id AS figure_id,
        '' AS title,
        IF (
          CHARACTER_LENGTH(r.text) > 100,
          CONCAT(LEFT(r.text, 100), '...'),
          r.text
        ) AS text,
        r.creation_time AS creation_time,
        r.push_time AS end_time,
        r.num_likes AS num_likes
      FROM available_responses r
      JOIN all_users u
      ON
        r.actor_id = ?
        AND r.actor_id = u.userid
        AND r.push_time < ?
    ` + creationTimeFilter +
    ` ORDER BY r.num_likes DESC , r.creation_time DESC
      LIMIT 50;
    `,
    [userid, Date.now()],
    conn.release()
  );
  res.send(new APIResponse(true, "fetch user highlights", {
    "content": rows
  }));
}
