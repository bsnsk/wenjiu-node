var mysql = require('mysql2/promise');
const configs = require('../../.conf.json');
const databaseConf = require('../../database.json');

var alchpool;

export function initPool(): void {
    alchpool = mysql.createPool(configs.mysql);
    return alchpool;
}

export async function initTables(): Promise<void> {
  const options = databaseConf.tables;
  let conn = await alchpool.getConnection();
  for (var i=0; i<options.length; i++) {
    const config: Object = options[i];
    const tableName: string = config["name"];
    var columnsSpec: string = "";
    for (var j=0; j<config["columns"].length; j++) {
      columnsSpec = columnsSpec
        + ` ${config["columns"][j]["name"]} ${config["columns"][j]["type"]},`;
    }
    columnsSpec = columnsSpec.slice(0, -1);
    /* PRIMARY */
    if (config["primary"] != undefined) {
      const primaries: string = config["primary"].join(", ");
      columnsSpec = columnsSpec + `, PRIMARY KEY ( ${primaries} )`;
    }
    /* UNIQUE */
    if (config["unique"] != undefined) {
      var uniqueStrings: Array<string> = [];
      for (var j=0; j<config["unique"].length; j++) {
          const uniqueName: string = config["unique"][j]["name"];
          const uniques: string = config["unique"][j]["columns"].join(', ');
          uniqueStrings.push(uniqueName + " (" + uniques + ")");
      }
      columnsSpec = columnsSpec + ", UNIQUE KEY " + uniqueStrings.join(', ');
    }
    /* CONSTRAINT */
    if (config["constraint"] != undefined) {
      for (var j=0; j<config["constraint"].length; j++) {
        columnsSpec = columnsSpec + ", CONSTRAINT " + config["constraint"][j]
      }
    }
    /* INDEX */
    if (config["index"] != undefined) {
      for (var j=0; j<config["index"].length; j++) {
        columnsSpec = columnsSpec + ", KEY " + config["index"][j]["name"]
          + " ( " + config["index"][j]["columns"].join(", ") + " ) ";
      }
    }
    var sqlStatement: string =
      `CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columnsSpec}
      ) ${config["appendix"]}`;
    console.log("init table with: \n\t" + sqlStatement);
    await conn.execute(
      sqlStatement
    );
  }
  conn.release();
}

export {alchpool};
