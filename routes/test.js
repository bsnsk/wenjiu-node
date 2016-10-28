var express = require('express');
var idgenerator = require('../idgenerator');
var router = express.Router();

router.get('/', async function(req, res, next) {
  res.render('test', {
    new_id: await idgenerator.genInt(),
  });
});

module.exports = router;
