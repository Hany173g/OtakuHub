const router = require('express').Router();


const loginController = require('../controllers/loginController')












router.post('/login',loginController.login)

router.post('/refreshToken',loginController.refreshToken)



router.post('/logout',loginController.logout)

module.exports = router