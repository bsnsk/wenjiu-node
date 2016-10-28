var express = require('express');
var idgenerator = require('../idgenerator');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send(idgenerator.genInt('user').toString());
});

module.exports = router;
