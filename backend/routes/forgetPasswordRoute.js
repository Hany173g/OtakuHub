const router = require('express').Router();


const forgetPassword = require('../controllers/forgetPasswordContoller')












router.post('/',forgetPassword.forgetPassword)
// router.get('/:token',forgetPassword.checkExpired)
router.post('/resetPassword',forgetPassword.resetPassword)


module.exports = router