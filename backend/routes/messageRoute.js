





const router = require('express').Router();


const privateMessage = require('../controllers/privateMessageContoller')












router.post('/addNewMessage',privateMessage.sendMessage)


router.post('/getChat',privateMessage.getChat)

module.exports = router