const router = require('express').Router();

const blogContoller = require('../controllers/blogContoller')
const {checkSizePhoto} = require('../utils/upload')







router.post('/createBlog',checkSizePhoto ,blogContoller.createBlog)



//likes

router.post('/addLikeBlog/',blogContoller.doAction);


router.post('/removelike/:blogId',blogContoller.removeLike)



// dislikes
router.post('/removeDislike/:blogId',blogContoller.removeDislike)

// router.post('/addDislikeBlog/:blogId',blogContoller.addDislikeBlog);
router.post('/addDislikeBlog/',blogContoller.doAction);




// comments

router.post('/addLikeComment/',blogContoller.doAction);
router.post('/adddisLikeComment/',blogContoller.doAction);



router.post('/addComment/:blogId',blogContoller.addComment);

router.post('/deleteBlog',blogContoller.deleteBlog)
router.post('/deleteComment',blogContoller.deleteComment)

router.get('/getBlogs',blogContoller.getBlogs)







router.post('/reportService',blogContoller.reportService)

module.exports = router