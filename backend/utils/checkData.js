


const {hashPassword} = require('./auth')

const{Groups,penningBlogs,User,blocks,Blogs,friends,commentsBlogs, requestFriend} = require('../models/Relationships')

const {Op, where} = require('sequelize')


const{isUser} = require('./isUser')




const checkData= ({content,title}) => {
    if (!content||!title)
    {
        return  next(createError("البينات ليست كامله",400))

    }
    return {content,title}
}



const checkPhoto = (file,next) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (file.size > 3000000)
    {
        return next(createError("يجب ان يكون الحجم اقصي شي 3 ميجا",400))
    
    }
    else  if (!allowedTypes.includes(file.mimetype)) {
        return next(createError("يجب ان يكون الصوره امتداد jpeg or png",400))
       
    }
    
}


const checkGroupData = (groupName,description,photo,privacy,group,bool,bool2) => {
    if (!groupName)
    {
         return next(createError("يجب وضع اسم لي الجروب",400))
    }
    else if(!description)
    {
          return next(createError("يجب وضع وصف لي الجروب",400))
       
    }
    else if (bool)
    {
         if(!photo)
        {
            return next(createError("يجب عليك وضع صوره لي الجروب",400))
         
        }
    }
    if (groupName.length < 4 || groupName.length > 19)
    {
          return next(createError("يجب ان يكون الجروب اكبر من 3 احرف واقل من 20",400))
       
    }
    else if (description.length < 10 || description.length > 999)
    {
         return next(createError("يجب ان يكون الوصف اكبر من 10 حروف واصغر من 1000",400))
    }
    if (bool2)
    {
         if (group)
        {
             return next(createError("هذا الأسم مستخدم من قبل",400))
        }
    }
   
    if (privacy != 'private' && privacy != 'public')
    {
          return next(createError("هذا القيم غير موجوده",400))
      
    }
    if (bool)
    {
        checkPhoto(photo)  
    }
     
}




const checkGroup = async(userData,groupName) => {
     let group = await Groups.findOne({where:{name:groupName}});
        if (!group)
        {
             return  next(createError("هذا الجروب غير موجود",400))
        }
        let checkUser = [];
        let user = null;
        if (userData)
        {
            user = await User.findByPk(userData.id);
            checkUser =  await group.getUsers({where:{id:user.id}})
        }
        return {user,checkUser,group};
}








// check if blog is find

const checkBlog = async(id,next) => {
        let blog = await Blogs.findByPk(id);
           if (!blog)
           {
                return  next(createError("هذا المقال غير موجود او تم حذفه",400))
        
           }
           return blog;
        }


const checkAction = (action ,service) => {
    if (service != 'comment' && service != 'blogs')
    {
        return  next(createError('يجب ان تختار حدث معين("comment or blogs")',400))
    }
    if (action != 'like' && action != 'dislike')
    {
         return  next(createError('يجب ان تختار حدث معين("like or dislike")',400))
    }
}





const checkChangeRole = (role,owner,userRole) => {
    let requesterRole  = owner[0].GroupMember.role;
 
    if (role ==='Admin' && requesterRole !== "owner")
    {
           return  next(createError("انت لأ تملك الصلأحيه الكافيه",401))
    } 
    else if (requesterRole === userRole)
    {
        return  next(createError("انت لأ تملك الصلأحيه الكافيه",401))
    }
}





const checkComment = async(id) => {
    let comment = await commentsBlogs.findByPk(id)
    if (!comment)
    {
        return  next(createError("هذا التعليق غير موجود او تم حذفه",400))
    }
    return comment;
}



const updateProfileValdtion = async (user, newUsername, newEmail, newPassword) => {
   
    let username = newUsername || user.username;
    let email = newEmail || user.email;
    let password = newPassword ? await hashPassword(newPassword) : user.password;
   
    return { username, email, password };
};




const checkDataMessage = async(username,content,user) => 
{
    let friend = await User.findOne({where:{username}});

            if (!friend)
            {
                return  next(createError("هذا الشخص غير موجود",400))
            }
            if (content) {
                if (content.length  < 1)
                {
                    return  next(createError("لأ تستطيع ارسال رساله بدون محتوي",400))
                }
                
            }
            else
            {
                 return  next(createError("البينات ليست كامله",400))
            }
            let isFriend = await user.getFriends({where:{
                [Op.or]:[
                    {userId:user.id,friendId:friend.id},
                    {userId:friend.id,friendId:user.id}
                ]
         }});
         if (!isFriend)
        {
             return  next(createError("انتم لستم اصدقاء",400))
        }
    return friend;
}





const checkFriendRequestData = async(userId,friendId) => {
        let[user,friend] = await Promise.all([
            User.findByPk(userId),
            User.findByPk(friendId),
            
        ])
    if (!user || !friend)
    {
         return  next(createError("هذا المستخدم غير موجود",400))

    }
  
}





const checkRole = async(role,owner) => {
    let userRole = owner[0].GroupMember.role;
    if (role === userRole)
    {
        return  next(createError("انتم الأثنين نفس الصلأحيه",400))
    }
    else if (role === "owner" && userRole === "Admin")
    {
         return  next(createError("لأ تملك الصلأحيات الكافيه",400))
    }
    else if (role === "Admin" && userRole === "Admin")
    {
         return  next(createError("لأ تملك اللصلأحيات الكافيه",400))
    }
}





const checkAcessMore = async(data,groupName) =>
{
      let user = await isUser(data);
      if (!groupName)
      {
          return  next(createError("البينات ليست كامله",400))
      }
        let group = await Groups.findOne({where:{name:groupName}});
        if (!group)
        {
              return  next(createError("هذا الجروب غير موجود",400))
        }
        const owner = await group.getUsers({ 
            through: { where: { role: ['owner','Admin'] ,userId:user.id} } 
        });
        if (owner.length < 1)
        {
            return  next(createError("لأ تملك صلأحيات لوصل لي هذا البينات",401))
        }
        return {group,user,owner};
}



const userAction = async(groupName,id,data) => 
{
       if (!id)
        {
             return  next(createError("البينات ليست كامله",400))
            
        }
       let {group} =  await checkAcessMore(data,groupName)
   
        let user = await group.getPendingUsers({through:{where:{id}}})
        
        
        if (user.length < 1)
        {
             return  next(createError("هذا الشخص غير موجود",400))
        }
        await group.removePendingUser(user);
        return {group,user}
}






const checkGroupRole = async(blog,user,userId) => {
       let checkRole;
       let groupId = blog.groupId
     if (groupId)
           {
              let group = await Groups.findByPk(groupId);
              if (!group)
                {
                     return  next(createError("هذا الجروب الجروب غير موجود",400))
                }  
              let member = await group.getUsers({through:{where:{userId:user.id, role: { [Op.in]: ['Admin', 'owner', 'Moderator'] } }}})
              let isOwnerBlog = blog.userId === userId;  
             if (member.length > 0 || isOwnerBlog)
                {
                    checkRole = member[0]
                } 
            else
                {
                     return  next(createError("ليس لديك الصلأحيات",401))
                    
                }
                 return {checkRole,group};
           }
           return {checkRole}
}











const checkAcess = async(data,groupName) =>
{
      let user = await isUser(data);
      if (!groupName)
      {
        return  next(createError("البينات ليست كامله",400))
      }
        let group = await Groups.findOne({where:{name:groupName}});
        if (!group)
        {
               return  next(createError("هذا الجروب غير موجود",400))
        }
        const owner = await group.getUsers({ 
            through: { where: { role: 'owner' ,userId:user.id} } 
        });
        if (owner.length < 1)
        {
            return  next(createError("لأ تملك صلأحيات لوصل لي هذا البينات",401))
        }
        return {group,user,owner};
}






const addLogger = async(group,userId,status) => {
    if (!group || !userId)
    {
           return  next(createError("البينات ليست كامله",400))
   
    }
    if (!["join", "leave", "newOwner", "kick"].includes(status)) {
        return  next(createError("هذا القيمه غير موجوده",400))
      
    }
    let user = await User.findByPk(userId)
    if (!user)
    {
         return  next(createError("المستخدم غير موجود",400))    
    }
    await group.createLoggerGroup({userId,status,photo:user.photo,username:user.username})
}














const checkReportData = async (service, serviceId, user, content, next) => {
    let group = null;
    let serviceData;
    if (!["blog", "comment"].includes(service) || !serviceId) {
        return next(createError("البينات غير صحيحه", 400));
    } else if (content.length < 10 || content.length > 150) {
        return next(createError("يجب ان يكون حجم البلأغ اكبر من 10 احرف واقل او يساوي من 150 حرف", 400));
    }
    if (service === 'blog') {
        serviceData = await Blogs.findByPk(serviceId);
    } else {
        serviceData = await commentsBlogs.findByPk(serviceId);
    }
    if (!serviceData) {
        return next(createError("هذا العنصر غير موجود", 404));
    } else if (serviceData.userId == user.id) {
        return next(createError("لأ يمكنك الابلاغ عن شي انت قمت بنشره", 400));
    }
    if (serviceData.groupId) {
        group = await Groups.findByPk(serviceData.groupId);
        if (!group) {
            return next(createError("هذا الجروب غير موجود", 404));
        }
    } else if (serviceData.groupId === undefined) {
        let blog = await Blogs.findByPk(serviceData.blogId);
        if (blog.groupId) {
            group = await Groups.findByPk(blog.groupId);
            if (!group) {
                return next(createError("هذا الجروب غير موجود", 404));
            }
        }
    }
    return { serviceData, group };
};





const checkStatsUsers = async(users,user) => {
 
        const usersIds = users.map(user => user.id)
        let[userFriends,requestFriends,recivceFriend] = await Promise.all([
            friends.findAll({where:{[Op.or]:[{userId:usersIds},{friendId:usersIds}]}}),
            requestFriend.findAll({where:{userId:usersIds}}),
            requestFriend.findAll({where:{friendId:usersIds}})            
        ])
        let result = users.map(User =>  {
            let userEdit = User.get({plain:true});
            if (userEdit.id != user.id)
            {
                  userFriends.map(f => {
                    if (f.friendId === User.id  || f.userId === User.id)
                    {
                        userEdit.isFriend = true
                    }
                })
            if (!userEdit.isFriend)
            {
                userEdit.isRequestFriend = requestFriends.some(r => r.userId === User.id)
            }
            
            else if (!userEdit.isRequestFriend)
            {
                userEdit.isRecivceFriend = recivceFriend.some(r => r.friendId === User.id)
            }
         
            
            
            }
            else
            {
                userEdit.isOwner = true
            }
            return userEdit
        })
      return result;
   
}





const checkGroupStats = async(GroupsData,user) => {
   
        const groupsIds = GroupsData.map(group => group.id)
        const userGroups = await Groups.findAll({where:{id:groupsIds}})
        let result = [];
        

        for (let group of userGroups)
        {
            let members = await group.getUsers({through:{where:{userId:user.id}}})
            let groupPlain = group.get({ plain: true });
            groupPlain.isMember = members.length > 0
            if (groupPlain.isMember)
            {
                  groupPlain.role = members[0].GroupMember.role || null
            }
          
           
           result.push(groupPlain)
        }
        return result

}




const checkBlogsStats = async(blogs) => {
    
        let groupsIds = blogs.map(blog => blog.groupId).filter(Boolean)
        let groups = await Groups.findAll({where:{id:groupsIds,privacy:'public'}})
     
        let result = blogs.map(blog => {
            if (blog.groupId)
            {
                   let checkPriacy = groups.find(group => group.id === blog.groupId)
                    if (checkPriacy)
                    {
                        return blog
                    }
                    else
                    {
                        return;
                    }
            }
            return blog
       
        })


        return result
    
    
}




const checkPenningBlogData = async(data,groupName,blogId) => {
      if (!blogId)
        {
              return  next(createError("البينات ليست كامله",400))
        }
     await checkAcessMore(data,groupName)  
        let blogPenned = await penningBlogs.findOne({where:{blogId}})
        if (!blogPenned)
        {
             return  next(createError("هذا المقاله غير موجوده",400))
        } 
        await blogPenned.destroy()
}











const checkIsBlock = async(user,friend) => {
        let block = await blocks.findOne({where:{
                [Op.or]:[
                    {recivceBlock:user.id,sentBlock: friend.id},
                    {recivceBlock:friend.id,sentBlock:user.id}

                ]
            }})
     if (block)
     {
         return  next(createError("هذا الشخص غير موجود",400))
     }
}



module.exports = {checkIsBlock,addLogger,checkBlogsStats,checkGroupStats,checkStatsUsers,checkData,checkChangeRole,checkPenningBlogData,checkGroupRole,userAction,checkRole,checkAcess,checkGroupData,checkGroup,checkAcessMore,checkReportData,checkDataMessage,checkPhoto,checkBlog,checkAction,checkComment,updateProfileValdtion,checkFriendRequestData}