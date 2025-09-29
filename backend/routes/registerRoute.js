const router = require('express').Router();


const registerContoller = require('../controllers/registerController')












router.post('/register',registerContoller.register)




module.exports = router