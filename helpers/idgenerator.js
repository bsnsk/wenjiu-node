var smartid = require('smart-id');
var typecheck = require('./typecheck');
var mysql = require('mysql2/promise');
var mysqlconf = require('../.conf.json').mysql;

module.exports = {
  genInt: async (type) => {
    let db = await mysql.createConnection(mysqlconf);
    do {
      id = parseInt(smartid.make('0', 18));
      let [rows, fields] = await db.execute('SELECT id FROM all_ids WHERE id=?;', 
        [id]);
      if (rows.length == 0)
        valid = 1;
      else valid = 0;
    } while (valid != 1);
    if (!typecheck.check(type, "string")) {
      console.log({'generate tmporary new id': id});
    }
    else {
      await db.execute('INSERT INTO all_ids (`id`, `type`) VALUES (?, ?)',
        [id, type]);
      console.log({'generate new id':id, 'type': type});
    }
    return id;
  } 
}
