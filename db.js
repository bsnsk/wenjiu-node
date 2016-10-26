var mysql = require('mysql');

module.exports = {
    init: function(name, options) {
        return module.exports[name] = mysql.createPool(options);
    }
};
