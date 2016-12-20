var mysql = require('mysql2/promise');

module.exports = {
    init: function(name, options) {
        return module.exports[name] = mysql.createPool(options);
    }
};
