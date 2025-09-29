const router = require('express').Router();


const notificationContoller = require('../controllers/notificationContoller')











router.get('/getFriendsRequest',notificationContoller.getFriendsRequest)




module.exports = router