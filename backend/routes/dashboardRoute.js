const router = require('express').Router();

const blogContoller = require('../controllers/blogContoller')
const dashboardContoller = require('../controllers/dashboardContoller')

// Public routes (no auth required)
router.post("/login", dashboardContoller.login)
router.post("/refreshToken", dashboardContoller.refreshToken)

// Protected routes (require authentication)
router.post("/logout",  dashboardContoller.logout)
router.post('/getHome',  dashboardContoller.getHome)


router.post('/searchUser',dashboardContoller.getUser)





router.post('/getLastSeensUser',dashboardContoller.getUserSeen)



router.post('/updateUser',dashboardContoller.updateUserData)


router.post('/addBan',dashboardContoller.banUser)



router.post('/removeBan',dashboardContoller.removeBan)


router.post('/getUserProfile',dashboardContoller.getProfileUser)



router.post('/deleteUser',dashboardContoller.deletUser)

router.post('/updateProfileStatus',dashboardContoller.updateProfileStatus)



router.post('/verifyUser',dashboardContoller.verifyUser)



router.post('/removeVerifUser',dashboardContoller.removeVerifyUser)





router.post('/getUserSecuirtyLogs',dashboardContoller.userSecuirtyLogs)

router.post('/getFavUser',dashboardContoller.getFavUser)



router.post('/getBlocks',dashboardContoller.getUserBlocks)


router.post('/createBlogUser',dashboardContoller.createBlog)

router.post('/sendBroadNotfcs',dashboardContoller.sendMessageToAllUsers)




module.exports = router