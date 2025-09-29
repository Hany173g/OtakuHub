const { likesBlogs ,likesComments, dislikesBlogs,dislikeComments,commentStats} = require("../models/Relationships");



// const addLike = async(user,id,service,item) => {
//     let like = service === 'blogs' ? likesBlogs : likesComments;
//     let dislike = service === 'blogs' ? dislikesBlogs : dislikeComments
//     let idColumn = service === 'blogs' ? 'blogId' : 'commentId';
    
//     const isLike = await like.findOne({where:{userId:user.id,[idColumn]:id}})
//     const isDislike = await dislike.findOne({where:{userId:user.id,[idColumn]:id}})
//         if (isLike)
//         {
//             throw new Error("لقد قمت بلفعل بوضع اعجاب")
//         }
     
        
//         let likes;
//         if (service === 'blogs') {
//             await user.createLikesBlog({ [idColumn]: id });
//             likes = await item.getBlogStat();
//         } else {
//             await user.createLikesComment({ [idColumn]: id });
//             likes = await item.getCommentStat();

//         }
//         if (likes)
//         {
        
//           await likes.increment('likesNumber', { by: 1 });
//         }
//         else
//         {
//             let newStats;
//             if (service === 'blogs')
//             {
//                  newStats =  await item.createBlogStat();
//             }
//             else
//             {
//                 newStats = await item.createCommentStat();
//             }

//             await newStats.increment('likesNumber', { by: 1 });
//         }
//         if (isDislike)
//         {
//             await isDislike.destroy();
//             await likes.decrement('dislikeNumber', { by: 1 });

//         }
// }




const Like_Dislike = async(user,id,service,item,actionUser) => {
    let like = service === 'blogs' ? likesBlogs : likesComments;
    let dislike = service === 'blogs' ? dislikesBlogs : dislikeComments
    let idColumn = service === 'blogs' ? 'blogId' : 'commentId';
    const action = actionUser === 'like' ? 'like' : 'dislike';
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
                }
                else
                {
                    await user.createLikesBlog({ [idColumn]: id });
                }
                actions = await item.getBlogStat();  



            } else {
                if (action === 'dislike')
            {
                await user.createDislikeComment({ [idColumn]: id });
            }
            else
            {
                await user.createLikesComment({ [idColumn]: id });
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
                }
                
        }
}



module.exports = {Like_Dislike};