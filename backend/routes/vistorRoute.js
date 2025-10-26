const router = require('express').Router();












const addVistorData = require('../controllers/vistorDataContoller')
const lastSeen = require('../controllers/lastSeenContoller')

router.post("/addUserData", addVistorData)



router.post('/addLastSeen', lastSeen.addLastSeen)


module.exports = router