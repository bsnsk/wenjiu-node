var mysqlconf = require('./.conf.json').mysql;
var pool = require('mysql2/promise').createPool(mysqlconf);
var schedule = require('node-schedule');
var http = require('http');

var appkey = '5821e7cf506122b4596f2b9d';
var seckey = 'sec-JmBF4FqQa4AxF6cQ42g3qUCL1bHlZiLJHMMNM2f6Q8uRWnPl';

function postToPushNotiPlat(alias, message){
  var postData = JSON.stringify({
    'method': 'publish_to_alias',
    'appkey': appkey,
    'seckey': seckey,
    'alias': alias,
    'msg': message,
    'opts': {
      'time_to_live': '604800',
      'qos': '1'
    }
  });
  var options = {
    host: 'rest.yunba.io',
    port: '8080',
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  callback = function (response) {
    console.log({'post to PushNotiPlat': {
      'StatusCode': response.statusCode,
      'headers': response.headers,
    }});
    var str = ''
    response.on('data', function (chunk) {
      str += chunk;
    });
  
    response.on('end', function () {
      console.log(str);
    });

  }

  var postReq = http.request(options, callback)
  .on('error', function(e) {
    console.log(e);
  });

  postReq.write(postData);
  postReq.end();
}

async function scheduleScanner() {
    schedule.scheduleJob('0 * * * * *', async () => {
        var currentTime = Date.now();
        var timeInterval = 60000; 
        console.log({
          'name': 'scheduleScanner:',
          'time': new Date(),
          'currentTime(ms)': currentTime
        });
        let conn = await pool.getConnection(pool);
        let [rows, fields] = await conn.execute(
          ` SELECT 
              req.publisher_id AS userid,
              res.response_id,
              res.request_id,
              res.push_time 
            FROM available_responses res 
            JOIN available_requests req
            ON res.request_id = req.request_id
            WHERE 
              res.push_time >= ?
              AND res.push_time <= ?
              AND res.status IS NULL
            ORDER BY push_time;
          `,
          [currentTime, currentTime + timeInterval * 2]
        );
        console.log(rows);
        for (var i=0; i<rows.length; i++) {
          var alias = rows[i].userid.toString();
          var message = JSON.stringify(rows[i]);
          console.log({"pushing": {"alias": alias, "message": message}});
          postToPushNotiPlat(alias, message);
        }
        conn.execute(
          ` UPDATE available_responses 
            SET status='pushed'
            WHERE 
              push_time >= ?
              AND push_time <= ?
              AND status IS NULL;
          `,
          [currentTime, currentTime + timeInterval * 2],
          conn.release()
        );
    }); 
}

scheduleScanner();

