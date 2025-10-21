const{User,Blogs,penningBlogs,GroupMember,report,groupSettings,Groups,nestedComments,Favorite,historyDeleteGroup,dislikesBlogs,BlogStats, ccommentsBlogs, commentStats, likesComments, likesBlogs, dislikeComments, Profile, commentsBlogs} = require('../models/Relationships')

const {createError} = require('../utils/createError')


const {isUser} =require('../utils/isUser')
const {checkData,checkReportData,checkBlog,checkAddFav,checkComment,checkGroupRole,checkAction} =require('../utils/checkData')
const {Like_Dislike} = require('../utils/stats')

const {createBlog} = require('../service/blogService')


const {getBlogs} = require('../service/getBlogs')
const sequelize = require('../config/database')



// create New Blog and check data and upload photo (optional)

exports.createBlog = async(req,res,next) => {
    try {
    let user =   await  isUser(req.user,next)
   let {newBlog} =  await createBlog(req.body,req.file,user)

    res.status(201).json({blogData:newBlog})
    }catch(err)
    {
       next(err)
    }
}









exports.removeLike = async(req,res,next) => {
    try{
 
        let user =   await  isUser(req.user,next)
        const {blogId} = req.params;
        let blog = await checkBlog(blogId,next);
           let isLike = await likesBlogs.findOne({where:{
            userId:user.id,
            blogId
        }})
        if (!isLike)
        {
           throw createError("انت لم تقم بلأعجاب",400)
         
        }
        
        let blogLikes = await blog.getBlogStat();
         await isLike.destroy();
        await blogLikes.decrement('likesNumber', { by: 1 });
        let profile = await Profile.findOne({where:{userId:user.id}})
        if (profile)
        {
            await profile.decrement("likes",{by:1})
        }
        res.status(204).json()
    }catch(err)
    {
         next(err)
    }
}

exports.removeDislike = async(req,res,next) => {
    try{
        let user =   await  isUser(req.user,next)
        const {blogId} = req.params;
        let blog = await checkBlog(blogId,next);
           let isDislike = await dislikesBlogs.findOne({where:{
            userId:user.id,
            blogId
        }})
        if (!isDislike)
        {
            throw createError("انت لم تقم بعدم الأعجاب",400) 
        }
        let blogLikes = await blog.getBlogStat();
         await isDislike.destroy();
        await blogLikes.decrement('dislikeNumber', { by: 1 });
        res.status(204).json()
    }catch(err)
    {
          next(err)
    }
}





exports.addComment = async(req,res,next) => {
    try{
         let user =   await  isUser(req.user,next)
         const{content} = req.body; 
         if (!content)
         {
                throw createError("لأ يوجد محتوي في التعليق",400)
           
         }
         const {blogId} = req.params;
         let blog = await checkBlog(blogId,next);
         let newComment = await user.createCommentsBlog({blogId,content})
         let BlogStats = await blog.getBlogStat();
         if (!BlogStats) {
                BlogStats = await blog.createBlogStat();
        }
         await BlogStats.increment('commentsNumber', { by: 1 });
         let isOwner = newComment.userId === req.user.id;   
         res.status(201).json({
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
          next(err)
    }
}










exports.doAction = async(req,res,next) => {
    try{
       const {action,service,id} = req.body;
       checkAction(action,service,next) 
       let item;
       if (service === 'blogs')
       {
          item = await checkBlog(id,next);
       }
       else
       {
        item = await checkComment(id,next);
       }
       let user =   await  isUser(req.user,next)
       await Like_Dislike(user,id,service,item,action,null ,next)
       res.status(201).json()
    }catch(err)
    {
        next(err)
    }
}





exports.getBlogs = async(req,res,next) => {
    try {

    let allBlogs = await getBlogs(req,res,'home',null)
   
    res.status(200).json(allBlogs)
    }catch(err)
    {
        next(err)
    }
}





const createHistoryGroup = async(blog,user,group,service) => {
     const [ownerService,administrator,roleDeleteService] = await Promise.all([
                 User.findByPk(blog.userId),
                  group.getUsers({through:{role:"owner"}}),
                   group.getUsers({id:user.id})
            ])
            
                await group.createHistoryDeleteGroup(
                    {
                administratorDelete:user.username,
                usernameOwnerBlogDelete:ownerService.username,
                 ownerInThisTime:administrator[0].username,contentDelete:blog.title,
                    roleDeleteBlog:roleDeleteService[0].GroupMember.role,service})
            
}




exports.deleteBlog = async(req,res,next) => {
    try{
           let user =   await  isUser(req.user,next)
           const{blogId} = req.body;          
           let blog = await checkBlog(blogId,next);
           if (!blog)
           {
                throw createError("هذا المقاله غير موجده",400)
            
           }
       
           let {checkRole,group} = await checkGroupRole(blog,user,blog.userId,next)
           if (checkRole && user.id != blog.userId)
           {
            await createHistoryGroup(blog,user,group,"blog")
           }
           else if (blog.userId != user.id)
           {
            throw createError("يجب ان تكون انت صاحب المقال لتسطيع حذفه",400)
        
           }
        
          
          let blogDelete =  await blog.destroy();
          res.status(204).json() 
    }catch(err)
    {
          next(err)
    }
}








exports.deleteComment = async(req,res,next) => {
    try{
         let user =   await  isUser(req.user,next)
         const {commentId} = req.body;
         let comment = await commentsBlogs.findByPk(commentId);
           
         if (!comment)
            {
              throw createError("هذا التعليق غير موجود",400)
            } 
        let blog = await Blogs.findOne({ where: { id: comment.blogId } });
      
            let {checkRole,group} = await checkGroupRole(blog,user)
           if (checkRole)
           {
             await createHistoryGroup(blog,user,group,"comment")
           }
            else if (comment.userId !== user.id) {
                throw createError("ليس لديك صلاحية لحذف هذا التعليق",400)
            }       
      
        let blogStat = await blog.getBlogStat();

        await blogStat.decrement('commentsNumber',{by:1})
        await comment.destroy();
        res.status(201).json()
    }catch(err)
    {
         next(err)
    }
}





exports.reportService = async(req,res,next) => {
    try{  
        let user =   await  isUser(req.user,next)
        const {service,serviceId,content} = req.body;
        let {serviceData,group} = await checkReportData(service,serviceId,user,content,next)
       
        if (group)
        {
             let groupSettings = await group.getGroupSetting();
              if (!groupSettings.allowReports)
                {
                    throw createError("قام المشرف بمن البلأغات",400)
                }
        }
      
        let groupId = group ? group.id : null;      
        await serviceData.createReport({userId:user.id,serviceId:serviceData.id,content,service,groupId})
        
        res.status(201).json({groupSettingsReport:groupSettings.allowReports});
    }catch(err)
    {
        console.log(err.message)
          next(err)
    }
}









exports.addFavorite = async(req,res,next) => {
    try{
          let user =   await  isUser(req.user,next)
          const {blogId} = req.body;
            await checkAddFav(user,blogId)
            let addFav = await user.createFavorite({blogId})
          res.status(201).json()
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}



exports.removeFavorite = async(req,res,next) => {
    try{
        let user =   await  isUser(req.user,next)
        const {blogId} = req.body;
        if (!blogId)
        {
            throw createError("البينات ليست كامله")
        }
      let isFav = await user.getFavorites({where:{blogId}});
      if (isFav < 1)
      {
        throw createError("انت لم تقم بلفعل بوضعه بي المفضله",400)
      }
      await isFav[0].destroy();
      res.status(201).json()
    }catch(err)
    {
        next(err)
    }
}



