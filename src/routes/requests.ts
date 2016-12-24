var express = require('express');
var userAuth = require('../helpers/userAuth').authenticate;
var router = express.Router();

/*
 * [GET] View a list of requests
 */
import discoverRequests from './requests/requestDiscover';
router.get('/', userAuth, discoverRequests);

/*
 * [GET] View a request
 */
import viewRequestDetail from './requests/requestDetail';
router.get('/:request_id', userAuth, viewRequestDetail);

/*
 * [DELETE] Delete a request
 */
import requestDelete from './requests/requestDelete';
router.delete('/:request_id', userAuth, requestDelete);

/*
 * [POST] Publish a request
 */
import requestPublish from './requests/requestPublish';
router.post('/', userAuth, requestPublish);

module.exports = router;
