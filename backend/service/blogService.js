const {checkData,checkPhoto,checkBlog,checkComment,checkAction} =require('../utils/checkData')


const{Blogs,groupSettings,penningBlogs, Groups, User} = require('../models/Relationships');
const { where } = require('sequelize');






const createBlog = async(Data,photo,user,id,next) => {
   let data = checkData(Data); 
 
    
    let newBlog ;
    let groupId = id === undefined ? null : id;
    if (photo)
    {  
     
        checkPhoto(photo,next)
        newBlog = await user.createBlog({
            content:data.content
            ,title:data.title
            ,photo:photo.filename,groupId
        })
       
    }
    else 
    {
         newBlog = await user.createBlog(
            {
                content:data.content,
                title:data.title,groupId
            })
    }
    let groupSetting = null;

    if (groupId)
    {
         let group = await Groups.findByPk(groupId)
         if (!group)
         {
             return next(createError("هذا الجروب غير موجود",400))
         }
          groupSetting = await group.getGroupSetting();
         let userRole = await group.getUsers({where:{id:user.id},through:{where:{userId:user.id}}});
         if (!groupSetting.publish && !["owner","Admin","Moderator"].includes(userRole[0].GroupMember.role))
         {
            await group.createPenningBlog({blogId:newBlog.id});
         }
    }
   
    return {newBlog,groupSetting};
}







module.exports = {createBlog};