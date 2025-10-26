const router = require('express').Router();


const notificationContoller = require('../controllers/notificationContoller')











router.get('/getFriendsRequest',notificationContoller.getFriendsRequest)




router.post('/markNotfcsRead',notificationContoller.markNotfcsRead)



router.get('/getNotication',notificationContoller.getNotication)


router.post('/getBroadCastNotfcs',notificationContoller.getBroadCastNotfcs)


router.post('/markBroadCastNotfcsRead',notificationContoller.markBroadCastNotfcsRead)


module.exports = router