var express = require('express');
var userAuth = require('../helpers/userAuth').authenticate;

var router = express.Router();

/*
 * [POST] User Registration
 */
import userRegistration from './users/userRegistration';
router.post('/', userRegistration);

/*
 * [GET] View a list of requests
 */
import userRequests from './users/userRequests';
router.get('/requests', userAuth, userRequests);

/*
 * [GET] View a list of requests and responses of a certain user,
 *      which will be presented at the user profile page as highlights.
 */
import userHighlights from './users/userHighlights';
router.get('/:userid/highlights', userAuth, userHighlights);

/*
 * [GET] View a list of requests and responses
 */
import userHistory from './users/userHistory';
router.get('/history', userAuth, userHistory);

/*
 * [GET] View a list of responses
 */
import userResponses from './users/userResponses';
router.get('/responses', userAuth, userResponses);

/*
 * [GET] Get public information of a user
 * [PUT] Update User Profile
 */
import {userProfileGet, userProfileUpdate} from './users/userProfile';
router.get('/:user_id', userAuth, userProfileGet);
router.put('/:user_id', userAuth, userProfileUpdate);

/*
 * [POST] Reset password
 */
import userPasswordReset from './users/userPasswordReset';
router.post('/:user_id/reset_password', userAuth, userPasswordReset);

module.exports = router;
