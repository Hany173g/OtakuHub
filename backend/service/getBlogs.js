
const{User,Blogs,nestedComments,Groups,dislikesBlogs,BlogStats, commentsBlogs, commentStats, likesComments, likesBlogs, dislikeComments} = require('../models/Relationships')

const {Op, where} = require('sequelize')


 const getBlogs = async(req,res,service,user,group) =>
{
    let blogs;
   if (service === 'home')
    {
           blogs = await Blogs.findAll({where:{ groupId: { [Op.is]: null }   },
            include: [
                commentsBlogs,
            ],
            limit: 20
        });
    } 
    else if (service === 'group')
    {
        blogs = await group.getBlogs({limit:20,include:[commentsBlogs]});
    
    }
    else
    {
       blogs = await Blogs.findAll({
            where: { userId: user.id,groupId: { [Op.is]: null } },
            include: [
                commentsBlogs
            ],
            limit: 20
        });
     
    }

    let allBlogs = [];
    const blogIds = blogs.map(b => b.id);
    const commentIds = blogs.flatMap(b => b.commentsBlogs.map(c => c.id));
    const userIdsFromComments = blogs.flatMap(b => b.commentsBlogs.map(c => c.userId));
    const [users, commentsLike, dislikesComments, likeBlogs, dislikeBlogs,blogStats,commenstStats,usersComments] = await Promise.all([    
    User.findAll({ where: { id: blogs.map(b => b.userId) } }),
    likesComments.findAll({ where: { commentId: commentIds } ,attributes:['commentId','userId']}),
    dislikeComments.findAll({ where: { commentId: commentIds} ,attributes:['commentId','userId'] }),
    likesBlogs.findAll({ where: { blogId: blogIds } ,attributes:['blogId','userId']}),
    dislikesBlogs.findAll({ where: { blogId: blogIds } ,attributes:['blogId','userId']}),
    BlogStats.findAll({where:{blogId:blogIds}}),
    commentStats.findAll({where:{commentId:commentIds}}),
    User.findAll({ where: { id:userIdsFromComments} ,attributes:['username','id','photo']}),
    ]);
 
    blogs.forEach(blog => {

          let blogPlain = blog.get({ plain: true });
            let userBlog = users.find(user => user.id === blog.userId);
       
            blogPlain.userData = userBlog
    
             blogPlain.commentsBlogs.forEach(comment => {
              if (req.user)
                {
                      let isLikeComment = commentsLike.find(
                    like => like.userId === req.user.id && like.commentId === comment.id
                    );
                    
                    let isDislikeComment = dislikesComments.find(
                        dis => dis.userId === req.user.id && dis.commentId === comment.id
                    );
                    let isOwnerComment = comment.userId == req.user.id;
                    comment.isLike = !!isLikeComment;
                    comment.isDislike = !!isDislikeComment;
                    comment.isOwnerComment = !!isOwnerComment
                    
                } 
                let commentsStat = commenstStats.find(commentStat => commentStat.commentId == comment.id)
                let dataUserComment = usersComments.find(userComment => userComment.id == comment.userId)
                comment.commentStats = commentsStat;
                comment.userData = dataUserComment;
             
        });
          if(req.user)
        {
        let isLikeBlog = likeBlogs.find(like => like.userId === req.user.id && like.blogId === blogPlain.id)
        let isDislikeBlog = dislikeBlogs.find(dislike => dislike.userId === req.user.id && dislike.blogId === blogPlain.id)
        blogPlain.isLike = !!isLikeBlog
        blogPlain.isDislike = !!isDislikeBlog
        blogPlain.isOwner = blogPlain.userId === req.user.id
    
     }
        blogPlain.blogStats = blogStats.find(b => b.blogId == blogPlain.id);
        
        


        allBlogs.push(blogPlain);
    
    })

    return allBlogs;
}



module.exports = {getBlogs}