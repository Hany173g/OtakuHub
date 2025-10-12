const { where } = require("sequelize");
const { likesBlogs ,Notifications,Groups,likesComments,User,GroupMember, dislikesBlogs,dislikeComments,commentStats, Blogs, Profile} = require("../models/Relationships");

const{Notificationsystem} = require('../service/NotifcationService')



const checkGroupStats = async(checkBlog,userId) => {
    let group = await Groups.findByPk(checkBlog);
            let checkUser = await group.getUsers({where:{id:userId}})
        if (group.privacy === 'private' && checkUser.length < 1)
            {
                throw new Error("هذا الجروب خاص")
            }
}

const Like_Dislike = async(user,id,service,item,actionUser,group) => {
    let like = service === 'blogs' ? likesBlogs : likesComments;
    let dislike = service === 'blogs' ? dislikesBlogs : dislikeComments
    let idColumn = service === 'blogs' ? 'blogId' : 'commentId';
    const action = actionUser === 'like' ? 'like' : 'dislike';  
    let userId;
    if (service ==='blogs')
    {
        let checkBlog = item.groupId;
        if (checkBlog)
        {
           await checkGroupStats(checkBlog,user.id)
        }
        userId = item.userId;
    }
    else
    {
        let checkComment = item.blogId;
        let blog = await Blogs.findByPk(checkComment)
        if (blog.groupId)
        {
           await  checkGroupStats(blog.groupId,user.id)
        }
    }
    let primaryAction;
    let secondaryAction ;
    if (action === 'like')
    {
         primaryAction = await like.findOne({where:{userId:user.id,[idColumn]:id}}) // like
         secondaryAction = await dislike.findOne({where:{userId:user.id,[idColumn]:id}}) // dislike
        if (primaryAction)
        {
            throw new Error("لقد قمت بلفعل بوضع اعجاب")
        }        
    }
    else {
        primaryAction = await dislike.findOne({where:{userId:user.id,[idColumn]:id}}) // dislike
         secondaryAction = await like.findOne({where:{userId:user.id,[idColumn]:id}}) // like
         
        if (primaryAction)
        {
            throw new Error("لقد قمت بلفعل بوضع  عدم اعجاب")
        }   
    }
        
        
        let actions;
        if (service === 'blogs') {
                if (action === 'dislike')
                {
                    await user.createDislikesBlog({ [idColumn]: id });
                    let content = `قام ${user.username} بعدم الإعجاب لمنشورك`;

                    await Notificationsystem(
                        item,
                        user,
                        "dislikeBlog",
                        content
                        )
                  
                }
                else
                {
                    await user.createLikesBlog({ [idColumn]: id });
                    let profile = await Profile.findByPk(userId)
                    if (!profile)
                    {
                        throw new Error("يبدو ان صاحب المنشور قد حذف  حسابو او تم حظر الحساب")
                    }
                    let content = `قام ${user.username}  بي الأعجاب لمنشورك`;

                    await Notificationsystem(
                        item,
                        user,
                        "dislikeBlog",
                        content
                        )
                    await profile.increment("likes",{by:1})
                }
                actions = await item.getBlogStat();  



            } else {
                if (action === 'dislike')
            {
                await user.createDislikeComment({ [idColumn]: id });
                     let content = `قام ${user.username} بعدم الإعجاب لتعليقك`;

                    await Notificationsystem(
                        item,
                        user,
                        "dislikeBlog",
                        content
                        )
            }
            else
            {
                await user.createLikesComment({ [idColumn]: id });
                  
                        let content = `قام ${user.username}  بي الأعجاب لتعليقك`;

                    await Notificationsystem(
                        item,
                        user,
                        "dislikeBlog",
                        content
                        )
                
            }
                actions = await item.getCommentStat();
            }
            if (actions)
            {
            
            if (action === 'like')
            {
                await actions.increment('likesNumber', { by: 1 });
              
            }
            else
            {
                await actions.increment('dislikeNumber', { by: 1 });
            
            }
          
        }
        else
        {
          
            if (service === 'blogs')
            {
                 actions =  await item.createBlogStat();
            }
            else
            {
                actions = await item.createCommentStat();
            }
            
            if (action === 'like')
                {
                    await actions.increment('likesNumber', { by: 1 });
                }
            else
            {
                await actions.increment('dislikeNumber', { by: 1 });
            }

        }
        if (secondaryAction)
        {
         await secondaryAction.destroy();
    
                if (action === 'like')
                {
                    await actions.decrement('dislikeNumber', { by: 1 });
                }
                else
                {
                    await actions.decrement('likesNumber', { by: 1 });
                     let profile = await Profile.findByPk(userId)
                    if (!profile)
                    {
                        throw new Error("يبدو ان صاحب المنشور قد حذف  حسابو او تم حظر الحساب")
                    }
                    await profile.decrement("likes",{by:1})
                }
                
        }
}

















module.exports = {Like_Dislike};