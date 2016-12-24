var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import {genInt as genId} from '../../helpers/idgenerator';
import APIResponse from '../../helpers/APIresponse';

export default async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var request_id = parseInt(req.body.request_id);
  var text = req.body.text;
  var multimedia;

  if (req.body.multimedia != undefined)
    multimedia = JSON.parse(req.body.multimedia);

  if (!typecheck.check(text, "string")
    || !typecheck.check(request_id, "int")) {
    typecheck.report(res);
    return;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    'SELECT request_id, end_time FROM available_requests WHERE ' +
    'request_id=?;',
    [request_id]
  );
  if (rows.length == 0)
    res.send(new APIResponse(false, "invalid request id"));
  else if (rows.length > 1)
    res.send(new APIResponse(false, "duplicate request id"));
  else {
    let response_id = await genId('response');
    await conn.execute(
      'INSERT INTO available_responses ( ' +
        '`response_id`, ' +
        '`actor_id`, ' +
        '`request_id`, ' +
        '`text`, ' +
        '`creation_time`, ' +
        '`push_time`' +
      ') VALUES (?, ?, ?, ?, ?, ?);',
      [
        response_id,
        userid,
        request_id,
        text,
        Date.now(),
        rows[0]['end_time'],
      ]
    );
    if (multimedia != undefined)
    for (var i=0; i<multimedia.length; i++) {
      await conn.execute(
        'INSERT INTO response_multimedia (' +
          '`response_id`, ' +
          '`multimedia_id` ' +
        ') VALUES (?,?);',
        [
          response_id.toString(),
          multimedia[i]
        ]
      );
    }
    res.send(new APIResponse(true, "response published", {
      "responseid": response_id.toString()
    }));
  }
  conn.release();
}
