const router = require('express').Router();


const groupContoller = require('../controllers/groupContoller');





const {checkSizePhoto} = require('../utils/upload')









router.post('/groups/create', checkSizePhoto, groupContoller.createGroup);



router.get('/groups', groupContoller.getAllGroups);

router.post('/joinGroup',groupContoller.joinGroup)

router.post('/addPost', checkSizePhoto, groupContoller.addPost)

router.post('/getGroup',groupContoller.getGroup)


router.post('/leaveGroup',groupContoller.leaveGroup)


router.post('/cancelJoinGroup',groupContoller.cancelJoinGroup)



router.get('/getPendingUsers',groupContoller.getPendingUsers)


router.post('/group/acceptUser',groupContoller.acceptUser)
router.post('/group/cancelUser',groupContoller.cancelUser)


router.get('/group/isAcess',groupContoller.isAccess)


router.post('/group/searchPendingUser',groupContoller.getPendingUser)



router.post('/group/searchMembers',groupContoller.searchMembers)




router.post('/group/kickUser',groupContoller.kickUser)

router.post('/group/updateGroupData', checkSizePhoto, groupContoller.updateGroupData);

router.post('/group/deleteGroup', groupContoller.deleteGroup);




router.post('/group/searchUserLogger',groupContoller.searchLogger)


router.post('/group/changeOwner',groupContoller.changeOwner)

router.post('/group/changeRole',groupContoller.changeRole)

router.post('/group/getGroupLogger/:status',groupContoller.getGroupLogger)


router.post('/group/getHistoryDelete/:service',groupContoller.getHistoryDelete)



router.post('/group/getReports',groupContoller.getReportsGroup);



router.post('/group/updateGroupSettings',groupContoller.updateGroupSettings)

router.post('/group/getBlogsPenning',groupContoller.getBlogsPenning)


router.post('/group/acceptBlogPenned',groupContoller.acceptBlogPenned)
router.post('/group/cancelBlogPenned',groupContoller.cancelBlogPenned)




router.post('/group/addNewWarring',groupContoller.addWarring)







router.get('/group/getBannedUser',groupContoller.getBannedUsers)







router.post('/group/removeBannedUser',groupContoller.removeBannedUser)


router.post('/group/searchUserBan',groupContoller.searchUserBan)






router.post('/group/searchUserReports',groupContoller.searchReports)





router.post('/group/searchHistoryDelete',groupContoller.searchHistoryDelete)

module.exports = router