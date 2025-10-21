const router = require('express').Router();


const notificationContoller = require('../controllers/notificationContoller')











router.get('/getFriendsRequest',notificationContoller.getFriendsRequest)




router.post('/markNotfcsRead',notificationContoller.markNotfcsRead)



router.get('/getNotication',notificationContoller.getNotication)

module.exports = router