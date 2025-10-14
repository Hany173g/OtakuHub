
const router = require('express').Router();




const searchSystem = require('../controllers/searchSystem')











router.post('/search',searchSystem.seacrchEngine)

module.exports = router