var express = require('express');
var path = require('path');
var multer  = require('multer')
var userAuth = require('../helpers/userAuth').authenticate;
var idgenerator = require('../helpers/idgenerator');
var typecheck = require('../helpers/typecheck');
var router = express.Router();

var upload = multer({ dest: 'data/' })

/*
 * [POST] Upload a file 
 */
router.post('/', userAuth, upload.single('data'), async (req, res, next) => {
  var db = require('../helpers/db').alchpool;
  var filetype = req.body.filetype;
  var userid = parseInt(req.headers.userid);

  if (!typecheck.check(filetype, "string")) {
    typecheck.report(res);
    return;
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
  db.query(
    "INSERT INTO multimedia (`content_id`, " +
      "`content_type`, " +
      "`uploader_id`, " +
      "`upload_time`, " +
      "`size`, " +
      "`path` )" +
      "VALUES (?,?,?,?,?,?);", 
    multimedia_info,
    (err, rows, fields) => {
      if (err) {
        console.log(err);
        return;
      }
      res.send(JSON.stringify({
        "status": "success",
        "message": "file uploaded",
        "content_id": id,
        "content_type": filetype 
      }));
    }
  );
});

router.get('/', userAuth, (req, res, next) => {
  var filePath = req.query["filepath"];

  if (!typecheck.check(filePath, "string")) {
    typecheck.report(res);
    return;
  }

  if (filePath.startsWith('../')) {
    res.send(JSON.stringify({
      "status": "failure",
      "message": "illegal path"
    }));
    return;
  } 

  console.log({
    "requesting": filePath,
    "providing": path.join(__dirname, '../data', filePath)
  });
  res.sendFile(path.join(__dirname, '../data', filePath));
});

module.exports = router;
