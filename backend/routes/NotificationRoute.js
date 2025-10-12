const router = require('express').Router();


const notificationContoller = require('../controllers/notificationContoller')











router.get('/getFriendsRequest',notificationContoller.getFriendsRequest)


router.get('/getNotication',notificationContoller.getNotication)

module.exports = router