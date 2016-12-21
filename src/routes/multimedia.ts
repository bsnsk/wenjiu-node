var express = require('express');
var path = require('path');
var multer  = require('multer')
var sizeOf = require('image-size');
var fs = require('fs');
var userAuth = require('../helpers/userAuth').authenticate;
var typecheck = require('../helpers/typecheck');
var md5File = require('md5-file/promise');
var alchpool = require('../helpers/db').alchpool;
import APIResponse from '../helpers/APIresponse';
import {genInt as genId} from '../helpers/idgenerator';
var router = express.Router();

var upload = multer({ dest: 'data/' })

/*
 * [POST] Upload a file
 */
router.post('/', userAuth, upload.single('data'), async (req, res, next) => {
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

  const newFilePath: string = path.join(__dirname, '../../', req.file.path);
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
});

/*
 * [GET] Download a multimedia file
 */
router.get('/', userAuth, async (req, res, next) => {
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
    console.log({
      "requesting": filePath,
      "providing": path.join(__dirname, '../../', filePath),
      "image-only": imageonly
    });
    res.append('Multimedia-Type', rows[0]['content_type'])
    if (imageonly != 'yes' || rows[0]['content_type'] == 'IMG') {
      res.sendFile(path.join(__dirname, '../../', filePath));
    }
    else {
      res.send(new APIResponse(true, "multimedia file not sent back"));
    }
  }
});

/*
 * [GET] Download dimensions of an image
 */
router.get('/:imageid/dimensions', userAuth, async (req, res, next) => {
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
});

module.exports = router;
