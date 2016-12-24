var express = require('express');
var userAuth = require('../helpers/userAuth').authenticate;
var router = express.Router();

/*
 * [POST] User login
 */
import userLogin from './sessions/userLogin';
router.post('/', userLogin);

/*
 * [DELETE] User logout
 */
import userLogout from './sessions/userLogout';
router.delete('/', userAuth, userLogout);

module.exports = router;
