var express = require('express');
var path = require('path');

var router = express.Router();

function sendAPKPackage(req, res, next) {
  res.setHeader(
    'Content-disposition',
    'attachment; filename=wenjiu.apk'
  );
  res.sendFile(path.join(__dirname, '../../data/wenjiu.apk'));
}

/*
 * [GET] Download APK package
 */
router.get('/', sendAPKPackage);

export default router;
