var express = require('express');
var userAuth = require('../helpers/userAuth').authenticate;
var router = express.Router();

/*
 * [GET] View a response
 */
import viewResponseDetail from './responses/responseDetail';
router.get('/:response_id', userAuth, viewResponseDetail);

/*
 * [POST] Like a response
 */
import responseLike from './responses/responseLike';
router.post('/:response_id/like', userAuth, responseLike);

/*
 * [DELETE] Delete a response
 */
import responseDelete from './responses/responseDelete';
router.delete('/:response_id', userAuth, responseDelete);

/*
 * [POST] Publish a response
 */
import responsePublish from './responses/responsePublish';
router.post('/', userAuth, responsePublish);

module.exports = router;
