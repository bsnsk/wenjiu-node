var path = require('path');
var sizeOf = require('image-size');
var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import {genInt as genId} from '../../helpers/idgenerator';
import APIResponse from '../../helpers/APIresponse';

export default async (req, res, next) => {
  var fileId = parseInt(req.params.imageid);

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
    console.log({
      "requesting": filePath,
      "providing": path.join(__dirname, '../../', filePath),
    });
    res.append('Multimedia-Type', rows[0]['content_type'])
    if (rows[0]['content_type'].toUpperCase() == 'IMG'
      || rows[0]['content_type'].toUpperCase() == 'JPEG'
      || rows[0]['content_type'].toUpperCase() == 'JPG'
      || rows[0]['content_type'].toUpperCase() == 'PNG'
    ) {
      var dimensions = sizeOf(path.join(__dirname, '../../', filePath));
      res.send(new APIResponse(true, "fetch image dimensions", {
        "width": dimensions.width,
        "height": dimensions.height,
      }))
    }
    else {
      res.send(new APIResponse(false, "file with the given id is not an image"));
    }
  }
}
