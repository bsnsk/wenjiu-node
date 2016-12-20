var smartid = require('smart-id');
var typecheck = require('./typecheck');
var mysql = require('mysql2/promise');
var mysqlconf = require('../../.conf.json').mysql;

export async function genInt(type: string): Promise<number> {
    let db = await mysql.createConnection(mysqlconf);
    var valid: boolean;
    var id: number;
    do {
      id = parseInt(smartid.make('0', 18));
      let [rows, fields] = await db.execute(
        'SELECT id FROM all_ids WHERE id=?;',
        [id]);
      valid = rows.length == 0 ? true : false;
    } while (!valid);
    if (!typecheck.check(type, "string")) {
      console.log({'generate tmporary new id': id});
    }
    else {
      await db.execute('INSERT INTO all_ids (`id`, `type`) VALUES (?, ?)',
        [id, type]);
      console.log({'generate new id':id, 'type': type});
    }
    db.end();
    return id;
}
