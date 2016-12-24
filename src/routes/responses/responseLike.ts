var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export default async (req, res, next) => {
  var response_id = parseInt(req.params.response_id);
  var actor_id = parseInt(req.headers.userid);
  if (!typecheck.check(response_id, "int")) {
    typecheck.report(res);
    return;
  }
  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    ` SELECT
        response_id
      FROM available_responses
      WHERE response_id = ?;
    `,
    [response_id]
  );
  if (rows.length == 0) {
    res.send(new APIResponse(false, "response id not found"));
    return;
  }
  var success: boolean = true;
  var err;
  try {
    await conn.execute(
      ` INSERT INTO thumbup (
          response_id,
          liker_id,
          like_time
        )
        VALUES (?, ?, ?);
      `,
      [
        response_id,
        actor_id,
        Date.now()
      ]
    );
  }
  catch (e) {
      success = false;
      err = e;
      console.log({"err": err})
  }
  if (success) {
    await conn.execute(
      ` UPDATE LOW_PRIORITY available_responses
        SET num_likes = num_likes + 1
        WHERE response_id = ?
      `,
      [response_id],
      conn.release()
    );
    res.send(new APIResponse(true, "like a response successfully."));
  }
  else {
    conn.release()
    res.send(new APIResponse(false, "probably you have already liked this response", {
      "detail": String(err).split("\n")[0]
    }))
  }
}
