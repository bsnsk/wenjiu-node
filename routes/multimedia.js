var express = require('express');
var path = require('path');
var typecheck = require('../typecheck');
var router = express.Router();

router.get('/', (req, res, next) => {
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
