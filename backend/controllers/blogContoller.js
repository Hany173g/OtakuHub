const{User,Blogs,GroupMember,Groups,nestedComments,dislikesBlogs,BlogStats, commentsBlogs, commentStats, likesComments, likesBlogs, dislikeComments} = require('../models/Relationships')



const {isUser} =require('../utils/isUser')
const {checkData,checkPhoto,checkBlog,checkComment,checkGroupRole,checkAction} =require('../utils/checkData')
const {Like_Dislike} = require('../utils/stats')

const {createBlog} = require('../service/blogService')


const {getBlogs} = require('../service/getBlogs')
const { where } = require('sequelize')



// create New Blog and check data and upload photo (optional)

exports.createBlog = async(req,res) => {
    try {
        // isUser check if user auth or not
       
    let user =   await  isUser(req.user)
   let newBlog =  await createBlog(req.body,req.file,user)
    res.status(200).json({blogData:newBlog})
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}









exports.removeLike = async(req,res) => {
    try{
        let user =   await  isUser(req.user)
        const {blogId} = req.params;
        let blog = await checkBlog(blogId);
           let isLike = await likesBlogs.findOne({where:{
            userId:user.id,
            blogId
        }})
        if (!isLike)
        {
            throw new Error("انت لم تقم بلأعجاب ")
        }
        let blogLikes = await blog.getBlogStat();
         await isLike.destroy();
        await blogLikes.decrement('likesNumber', { by: 1 });
        res.status(201).json()
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}

exports.removeDislike = async(req,res) => {
    try{
        let user =   await  isUser(req.user)
        const {blogId} = req.params;
        let blog = await checkBlog(blogId);
           let isDislike = await dislikesBlogs.findOne({where:{
            userId:user.id,
            blogId
        }})
        if (!isDislike)
        {
            throw new Error("انت لم تقم بعدم الأعجاب")
        }
        let blogLikes = await blog.getBlogStat();
         await isDislike.destroy();
        await blogLikes.decrement('dislikeNumber', { by: 1 });
        res.status(201).json()
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}





exports.addComment = async(req,res) => {
    try{
         let user =   await  isUser(req.user)
         const{content} = req.body; 
         if (!content)
         {
            throw new Error("لأ يوجد محتوي في التعليق")
         }
         const {blogId} = req.params;
         let blog = await checkBlog(blogId);
         let newComment = await user.createCommentsBlog({blogId,content})
         let BlogStats = await blog.getBlogStat();
         if (!BlogStats) {
                BlogStats = await blog.createBlogStat();
        }
         await BlogStats.increment('commentsNumber', { by: 1 });
         let isOwner = newComment.userId === req.user.id;   
         res.status(200).json({
             newComment: {
                 ...newComment.toJSON(),
                 userData: {
                     username: user.username,
                     photo: user.photo
                 }
             },
             username: user.username,
             isOwner
         })
        }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}








// user,id,service,item,actionUser



exports.doAction = async(req,res) => {
    try{
       const {action,service,id} = req.body;
       checkAction(action,service) 
       let item;
       if (service === 'blogs')
       {
          item = await checkBlog(id);
       }
       else
       {
        item = await checkComment(id);
       }
       let user =   await  isUser(req.user)
       await Like_Dislike(user,id,service,item,action)
       res.status(201).json()
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}





exports.getBlogs = async(req,res) => {
    try {
    let allBlogs = await getBlogs(req,res,'home',null)
    res.status(200).json({allBlogs})
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}









exports.deleteBlog = async(req,res) => {
    try{
           let user =   await  isUser(req.user)
           const{blogId} = req.body;          
           let blog = await checkBlog(blogId);
           if (!blog)
           {
            throw new Error("هذا المقاله غير موجده")
           }
           console.log(blog.groupId)
           let checkRole = await checkGroupRole(blog.groupId,user)
           if (checkRole)
           {
            
           }
           else if (blog.userId != user.id)
           {
             throw new Error("يجب ان تكون انت صاحب المقال لتسطيع حذفه")
           }

           await blog.destroy();
          res.status(200).json({message:"تم حذف المقاله"}) 
    }catch(err)
    {
        console.log(err.message)
        res.status(400).json({message:err.message})
    }
}








exports.deleteComment = async(req,res) => {
    try{
         let user =   await  isUser(req.user)
         const {commentId} = req.body;
         let comment = await commentsBlogs.findByPk(commentId);
           
         if (!comment)
            {
                throw new Error("هذا التعليق غير موجود")    
            } 
        let blog = await Blogs.findOne({ where: { id: comment.blogId } });
            let checkRole = await checkGroupRole(blog.groupId,user)
           if (checkRole)
           {
            
           }
            else if (comment.userId !== user.id) {
                throw new Error("ليس لديك صلاحية لحذف هذا التعليق");
            }       
      
        let blogStat = await blog.getBlogStat();

        await blogStat.decrement('commentsNumber',{by:1})
        await comment.destroy();
        res.status(200).json({message:"تم حذف التعليق"})
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}