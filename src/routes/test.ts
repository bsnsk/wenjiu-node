var express = require('express');
var idgenerator = require('../helpers/idgenerator');
var filter = require('../helpers/filter').blacklist;
var router = express.Router();

router.get('/', async function(req, res, next) {
  res.render('test', {
    new_id: await idgenerator.genInt(),
  });
});


router.get('/filter', filter, async function(req, res, next) {
  console.log(req.query);
  res.send('reached');
});

module.exports = router;
