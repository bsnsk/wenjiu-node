var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {

  var db = require('../db').alchpool;

  db.query('SELECT username FROM all_users;', function(err, rows, fields){
    console.log(rows);
    console.log('delimiter');
    console.log(fields);
    var userlist="all users: <br><ul>";
    for (var i=0; i<rows.length; i++)
      userlist += "<li>" + rows[i]['username'] + '</li>';
    userlist += '</ul>';
    res.send(userlist);
  });
});

module.exports = router;
