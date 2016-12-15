var express = require('express');
var path = require('path');
var multer  = require('multer')
var sizeOf = require('image-size');
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
      "providing": path.join(__dirname, '../', filePath),
      "image-only": imageonly
    });
    res.append('Multimedia-Type', rows[0]['content_type'])
    if (imageonly != 'yes' || rows[0]['content_type'] == 'IMG') {
      res.sendFile(path.join(__dirname, '../', filePath));
    }
    else {
      res.send(JSON.stringify({
        "status": "success",
	"message": "multimedia file not sent back"
      }))
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
      "providing": path.join(__dirname, '../', filePath),
    });
    res.append('Multimedia-Type', rows[0]['content_type'])
    if (rows[0]['content_type'].toUpperCase() == 'IMG'
      || rows[0]['content_type'].toUpperCase() == 'JPEG'
      || rows[0]['content_type'].toUpperCase() == 'JPG'
      || rows[0]['content_type'].toUpperCase() == 'PNG'
    ) {
      var dimensions = sizeOf(path.join(__dirname, '../', filePath));
      res.send(JSON.stringify({
        "status": "success",
        "message": "fetch image dimensions",
        "width": dimensions.width,
        "height": dimensions.height,
      }))
    }
    else {
      res.send(JSON.stringify({
        "status": "failure",
	      "message": "file with the given id is not an image"
      }))
    }
  }
});

module.exports = router;
