var path = require('path');
var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import {genInt as genId} from '../../helpers/idgenerator';
import APIResponse from '../../helpers/APIresponse';

export default async (req, res, next) => {
  var fileId = parseInt(req.query.fileid);
  var imageonly = req.headers.imageonly;

  if (!typecheck.check(fileId, "int")) {
    typecheck.report(res);
    return;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    'SELECT path, content_type FROM multimedia WHERE content_id=?',
    [fileId],
    conn.release()
  );
  if (rows.length == 0)
    res.send(new APIResponse(false, "file not found"));
  else if (rows.length > 1)
    res.send(new APIResponse(false, "file id has duplicates (probably a server error)"));
  else {
    var filePath: string = rows[0]['path'];
    var actualFilePath: string = path.join(__dirname, '../../../', filePath);
    console.log({
      "requesting": filePath,
      "providing": actualFilePath,
      "image-only": imageonly
    });
    res.append('Multimedia-Type', rows[0]['content_type'])
    if (imageonly != 'yes' || rows[0]['content_type'] == 'IMG') {
      res.sendFile(actualFilePath);
    }
    else {
      res.send(new APIResponse(true, "multimedia file not sent back"));
    }
  }
}
