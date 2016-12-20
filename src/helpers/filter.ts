var blacklistWords = require('../../blacklist.json');

module.exports = {
  blacklist: (req, res, next) => {
    console.log(req);
    for (var i=0; i<blacklistWords.length; i++)
      if (JSON.stringify({
        "headers": req.headers,
        "body": req.body,
        "params": req.params,
        "query": req.query
      }).search(blacklistWords[i]) != -1) {
        res.send(JSON.stringify({
          "status": "failure",
          "message": "sensitive elements in your request"
        }));
        return;
      }
    next()
  }
};
