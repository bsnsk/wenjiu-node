
/* DEPRECATED */

var express = require('express');
import {genInt as genId} from '../helpers/idgenerator';
var filter = require('../helpers/filter').blacklist;
var router = express.Router();

router.get('/', async function(req, res, next) {
  res.render('test', {
    new_id: await genId("test"),
  });
});


router.get('/filter', filter, async function(req, res, next) {
  console.log(req.query);
  res.send('reached');
});

module.exports = router;
