var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import APIResponse from '../../helpers/APIresponse';
import {genInt as genId} from '../../helpers/idgenerator';


export default async (req, res, next) => {
  var userid = parseInt(req.headers.userid);
  var title = req.body.title;
  var text = req.body.text;
  var end_time = req.body.endtime;
  var multimedia;

  if (req.body.multimedia != undefined)
    multimedia = JSON.parse(req.body.multimedia);

  if (!typecheck.check(text, "string")
    || !typecheck.check(end_time, "int")
    || end_time <= Date.now()) {
    typecheck.report(res);
    return;
  }

  if (title == undefined)
    title = '';

  let id = await genId('request');
  let request_info =
    [
      id,
      title,
      text,
      Date.now(),
      end_time,
      userid,
    ];
  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    'INSERT INTO available_requests (' +
      '`request_id`,' +
      '`title`, ' +
      '`text`, ' +
      '`creation_time`, ' +
      '`end_time`, ' +
      '`publisher_id`' +
    ') VALUES (?, ?, ?, ?, ?, ?)',
    request_info
  );
  if (multimedia != undefined)
  for (var i=0; i<multimedia.length; i++) {
    let [rows, fields] = await conn.execute(
      'INSERT INTO request_multimedia (' +
        '`request_id`, ' +
        '`multimedia_id` ' +
      ') VALUES (?,?)',
      [
        id.toString(),
        multimedia[i]
      ]
    );
  }
  res.send(new APIResponse(true, "request published", {
    "requestid": id.toString()
  }))
  conn.release();
}
