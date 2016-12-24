var express = require('express');
var multer  = require('multer')
var sizeOf = require('image-size');
var userAuth = require('../helpers/userAuth').authenticate;
var router = express.Router();

var upload = multer({ dest: 'data/' })

/*
 * [POST] Upload a file
 */
import fileUpload from './multimedia/fileUpload';
router.post('/', userAuth, upload.single('data'), fileUpload);

/*
 * [GET] Download a multimedia file
 */
import fileDownload from './multimedia/fileDownload';
router.get('/', userAuth, fileDownload);

/*
 * [GET] Download dimensions of an image
 */
import imageDimensions from './multimedia/imageDimensions';
router.get('/:imageid/dimensions', userAuth, imageDimensions);

module.exports = router;
