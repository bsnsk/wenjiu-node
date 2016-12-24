var md5File = require('md5-file/promise');
var path = require('path');
var fs = require('fs');
var typecheck = require('../../helpers/typecheck');
var alchpool = require('../../helpers/db').alchpool;
import {genInt as genId} from '../../helpers/idgenerator';
import APIResponse from '../../helpers/APIresponse';

export default async (req, res, next) => {
  var nameSplit = req.file.originalname.split('.');
  var filetype = nameSplit[nameSplit.length-1];
  var userid = parseInt(req.headers.userid);

  console.log({"file": req.file, "filetype": filetype});

  if (!typecheck.check(filetype, "string")) {
    typecheck.report(res);
    return;
  }

  if (req.file.size > 5242880) { // 5MB
    res.send(new APIResponse(false, "file larger than 5MB"));
  }

  console.log(req.file.originalname);
  let conn = await alchpool.getConnection();

  const newFilePath: string = path.join(__dirname, '../../../', req.file.path);
  let hash = await md5File(newFilePath);

  let [rows, fields] = await conn.execute(
    ` SELECT file_id
      FROM file_hashes
      WHERE file_hash = ?;
    `,
    [hash]
  );

  if (rows.length > 0) {
    console.log(`file md5 ${hash} already exists!`);
    fs.unlink(newFilePath);
    res.send(new APIResponse(true, "file uploaded", {
      "content_id": rows[0]["file_id"],
      "content_type": filetype
    }));
    conn.release();
    return;
  }

  let id = await genId('multimedia');
  await conn.execute(
    ` INSERT INTO file_hashes
        (file_id, file_hash)
      VALUES (?, ?);
    `,
    [id, hash]
  );

  let multimedia_info =
    [
      id,
      filetype,
      userid,
      Date.now(),
      req.file.size,
      req.file.path,
    ];
  [rows, fields] = await conn.execute(
    "INSERT INTO multimedia (`content_id`, " +
      "`content_type`, " +
      "`uploader_id`, " +
      "`upload_time`, " +
      "`size`, " +
      "`path` )" +
      "VALUES (?,?,?,?,?,?);",
    multimedia_info,
    conn.release()
  );
  res.send(new APIResponse(true, "file uploaded", {
    "content_id": id,
    "content_type": filetype
  }))
}
