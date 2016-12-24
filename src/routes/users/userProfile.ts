var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';

export {
  userProfileGet,
  userProfileUpdate
};

async function userProfileGet(req, res, next) {
  var user_id = parseInt(req.params.user_id);
  if (!typecheck.check(user_id, "int")) {
    typecheck.report(res);
    return;
  }
  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    `SELECT
      username,
      nickname,
      gender,
      signature,
      figure_id,
      rating,
      disabled
    FROM all_users
    WHERE userid=?`,
    [user_id],
    conn.release()
  );
  if (rows.length == 0)
    res.send(new APIResponse(false, "user not found"));
  else if (rows.length > 1)
    res.send(new APIResponse(false, "user id has duplicates (probably a server error)"))
  else {
    res.send(new APIResponse(true, "user fetched", {
      "content": rows[0]
    }));
  }
}

async function userProfileUpdate(req, res, next) {
  var user_id = parseInt(req.params.user_id);
  var actor_id = parseInt(req.headers.userid);
  var infoStrings: Array<string> = [];
  const subjects = ['gender', 'figure_id', 'nickname', 'signature'];
  const subject_type = ['string', 'int', 'string', 'string'];

  console.log({"update user": user_id, "by": actor_id, "info": req.body});

  for (var i=0; i<subjects.length; i++)
    if (req.body[subjects[i]] != undefined) {
      if (subject_type[i] != 'string')
        infoStrings.push(subjects[i] + '=' + req.body[subjects[i]])
      else
        infoStrings.push(subjects[i] + "='" + req.body[subjects[i]] + "'")
    }

  var setupString = infoStrings.join(',');

  if (!typecheck.check(user_id, "int")
    || user_id != actor_id) {
      typecheck.report(res);
      return;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    ` UPDATE all_users
      SET `
        + setupString +
    ` WHERE userid=?;`,
    [user_id],
    conn.release()
  );
  res.send(new APIResponse(true, "user profile updated"));
}
