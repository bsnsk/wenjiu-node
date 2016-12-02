var express = require('express');
var path = require('path');
var multer  = require('multer')
var userAuth = require('../helpers/userAuth').authenticate;
var idgenerator = require('../helpers/idgenerator');
var typecheck = require('../helpers/typecheck');
var alchpool = require('../helpers/db').alchpool;
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
    res.send(JSON.stringify({
      "status": "failure",
      "message": "file larger than 5MB"
    }));
  }

  console.log(req.file.originalname);

  let id = await idgenerator.genInt('multimedia');
  let multimedia_info =
    [
      id,
      filetype,
      userid,
      Date.now(),
      req.file.size,
      req.file.path,
    ];
  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
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
  res.send(JSON.stringify({
    "status": "success",
    "message": "file uploaded",
    "content_id": id,
    "content_type": filetype 
  }));
});

router.get('/', userAuth, async (req, res, next) => {
  var fileId = parseInt(req.query.fileid);

  if (!typecheck.check(fileId, "int")) {
    typecheck.report(res);
    return;
  }

  let conn = await alchpool.getConnection();
  let [rows, fields] = await conn.execute(
    'SELECT path FROM multimedia WHERE content_id=?',
    [fileId],
    conn.release()
  );
  if (rows.length == 0)
    res.send(JSON.stringify({
      "status": "failure",
      "message": "file not found"
    }));
  else if (rows.length > 1)
    res.send(JSON.stringify({
      "status": "failure",
      "message": "file id has duplicates (probably a server error)"
    }));
  else {
    filePath = rows[0]['path'];
    console.log({
      "requesting": filePath,
      "providing": path.join(__dirname, '../', filePath)
    });
    res.sendFile(path.join(__dirname, '../', filePath));
  }
});

module.exports = router;
