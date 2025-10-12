const router = require('express').Router();

const  profileContoller = require('../controllers/profileContoller')



const {checkSizePhoto} = require('../utils/upload')









router.get('/getProfile/:username',profileContoller.getProfile);


router.post('/updateProfile/',checkSizePhoto,profileContoller.addUserData)


router.post('/rejectRequest',profileContoller.reject);


router.post('/acceptRequest',profileContoller.acceptRequest)



router.post('/cancelFriend',profileContoller.cancelFriend);




router.post('/profile/:username/blockUser',profileContoller.blockUser)


router.post('/profile/:username/cancelBlock',profileContoller.cancelBlock)



router.get('/profile/getBlocks',profileContoller.getBlocks)

router.post('/profile/removeBlock',profileContoller.removeBlock)


module.exports = router