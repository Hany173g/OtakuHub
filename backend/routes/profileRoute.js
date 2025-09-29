const router = require('express').Router();

const  profileContoller = require('../controllers/profileContoller')



const {checkSizePhoto} = require('../utils/upload')









router.get('/getProfile/:username',profileContoller.getProfile);


router.post('/updateProfile/',checkSizePhoto,profileContoller.addUserData)


router.post('/rejectRequest',profileContoller.reject);


router.post('/acceptRequest',profileContoller.acceptRequest)



router.post('/cancelFriend',profileContoller.cancelFriend);

module.exports = router