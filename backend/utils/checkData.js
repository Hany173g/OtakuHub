


const {hashPassword} = require('./auth')

const{Groups,penningBlogs,User,blocks,Blogs,friends,commentsBlogs, requestFriend} = require('../models/Relationships')

const {Op, where} = require('sequelize')


const{isUser} = require('./isUser')




const checkData= ({content,title}) => {
    if (!content||!title)
    {
        throw new Error("البينات ليست كامله")
    }
    return {content,title}
}



const checkPhoto = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (file.size > 3000000)
    {
        throw new Error("يجب ان يكون الحجم اقصي شي 3 ميجا")
    }
    else  if (!allowedTypes.includes(file.mimetype)) {
        throw new Error("يجب ان يكون الصوره امتداد jpeg or png");
    }
    
}


const checkGroupData = (groupName,description,photo,privacy,group,bool,bool2) => {
    if (!groupName)
    {
        throw new Error("يجب وضع اسم لي الجروب")
    }
    else if(!description)
    {
        throw new Error("يجب وضع وصف لي الجروب")
    }
    else if (bool)
    {
         if(!photo)
        {
            throw new Error("يجب عليك وضع صوره لي الجروب")
        }
    }
    if (groupName.length < 4 || groupName.length > 19)
    {
        throw new Error("يجب ان يكون الجروب اكبر من 3 احرف واقل من 20")
    }
    else if (description.length < 10 || description.length > 999)
    {
        throw new Error("يجب ان يكون الوصف اكبر من 10 حروف واصغر من 1000")
    }
    if (bool2)
    {
         if (group)
        {
            throw new Error("هذا الأسم مستخدم من قبل")
        }
    }
   
    if (privacy != 'private' && privacy != 'public')
    {
        throw new Error("هذا القيم غير موجوده")
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
            throw new Error("هذا الجروب غير موجود")
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

const checkBlog = async(id) => {
        let blog = await Blogs.findByPk(id);
           if (!blog)
           {
            throw new Error("هذا المقال غير موجود او تم حذفه")
           }
           return blog;
        }


const checkAction = (action ,service) => {
    if (service != 'comment' && service != 'blogs')
    {
        throw new Error('يجب ان تختار حدث معين("comment or blogs")')
    }
    if (action != 'like' && action != 'dislike')
    {
        throw new Error('يجب ان تختار حدث معين("like or dislike")')
    }
}





const checkChangeRole = (role,owner,userRole) => {
    let requesterRole  = owner[0].GroupMember.role;
 
    if (role ==='Admin' && requesterRole !== "owner")
    {
        throw new Error("انت لأ تملك الصلأحيه الكافيه")
    } 
    else if (requesterRole === userRole)
    {
        throw new Error("انت لأ تملك الصلأحيه الكافيه")
    }
}





const checkComment = async(id) => {
    let comment = await commentsBlogs.findByPk(id)
    if (!comment)
    {
        throw new Error("هذا التعليق غير موجود او تم حذفه")
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
                throw new Error("هذا الشخص غير موجود")
            }
            if (content) {
                if (content.length  < 1)
                {
                    throw new Error("لأ تستطيع ارسال رساله بدون محتوي")
                }
                
            }
            else
            {
                throw new Error("البينات ليست كامله")
            }
            let isFriend = await user.getFriends({where:{
                [Op.or]:[
                    {userId:user.id,friendId:friend.id},
                    {userId:friend.id,friendId:user.id}
                ]
         }});
         if (!isFriend)
        {
            throw new Error("انتم لستم اصدقاء")
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
        throw new Error("هذا المستخدم غير موجود")
    }
  
}





const checkRole = async(role,owner) => {
    let userRole = owner[0].GroupMember.role;
    if (role === userRole)
    {
        throw new Error("انتم الأثنين نفس الصلأحيه")
    }
    else if (role === "owner" && userRole === "Admin")
    {
        throw new Error("لأ تملك الصلأحيات الكافيه")
    }
    else if (role === "Admin" && userRole === "Admin")
    {
        throw new Error("لأ تملك اللصلأحيات الكافيه")
    }
}





const checkAcessMore = async(data,groupName) =>
{
      let user = await isUser(data);
      if (!groupName)
      {
        throw new Error("البينات ليست كامله")
      }
        let group = await Groups.findOne({where:{name:groupName}});
        if (!group)
        {
                throw new Error("هذا الجروب غير موجود")
        }
        const owner = await group.getUsers({ 
            through: { where: { role: ['owner','Admin'] ,userId:user.id} } 
        });
        if (owner.length < 1)
        {
            throw new Error("لأ تملك صلأحيات لوصل لي هذا البينات")
        }
        return {group,user,owner};
}



const userAction = async(groupName,id,data) => 
{
       if (!id)
        {
            throw new Error("البينات ليست كامله")
        }
       let {group} =  await checkAcessMore(data,groupName)
   
        let user = await group.getPendingUsers({through:{where:{id}}})
        
        
        if (user.length < 1)
        {
            throw new Error("هذا الشخص غير موجود")
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
                    throw new Error("هذا الجروب الجروب غير موجود")
                }  
              let member = await group.getUsers({through:{where:{userId:user.id, role: { [Op.in]: ['Admin', 'owner', 'Moderator'] } }}})
              let isOwnerBlog = blog.userId === userId;  
             if (member.length > 0 || isOwnerBlog)
                {
                    checkRole = member[0]
                } 
            else
                {
                    throw new Error("ليس لديك الصلأحيات")
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
        throw new Error("البينات ليست كامله")
      }
        let group = await Groups.findOne({where:{name:groupName}});
        if (!group)
        {
                throw new Error("هذا الجروب غير موجود")
        }
        const owner = await group.getUsers({ 
            through: { where: { role: 'owner' ,userId:user.id} } 
        });
        if (owner.length < 1)
        {
            throw new Error("لأ تملك صلأحيات لوصل لي هذا البينات")
        }
        return {group,user,owner};
}






const addLogger = async(group,userId,status) => {
    if (!group || !userId)
    {
        throw new Error("البينات ليست كامله")
    }
    if (!["join", "leave", "newOwner", "kick"].includes(status)) {
        throw new Error("هذا القيمه غير موجوده")
    }
    let user = await User.findByPk(userId)
    if (!user)
    {
        throw new Error("المستخدم غير موجود")
    }
    await group.createLoggerGroup({userId,status,photo:user.photo,username:user.username})
}
















const checkReportData = async(service,serviceId,user,content) =>
{
    let group = null;
     let serviceData ;
        if (!["blog","comment"].includes(service) || !serviceId)
        {
            throw new Error("البينات غير صحيحه")
        }
        else if(content.length < 10 || content.length > 150)
       {
        throw new Error("يجب ان يكون حجم البلأغ اكبر من 10 احرف واقل او يساوي من 150 حرف")
       }
        if (service === 'blog')
        {
            serviceData = await Blogs.findByPk(serviceId)
        }
        else
        {
            serviceData = await commentsBlogs.findByPk(serviceId)
        }
         if (!serviceData)
        {
            throw new Error("هذا لعنصر غير موجود")
        }
        else if (serviceData.userId == user.id)
        {
            throw new Error("لأ يمكنك ابلغ عن شي انت قمت بنشره")
        }
        if (serviceData.groupId)
        {
             group = await Groups.findByPk(serviceData.groupId);
            if (!group)
            {
                throw new Error("هذا الجروب غير موجود")
            }
        }
        else if(serviceData.groupId === undefined)
        {
            let blog = await Blogs.findByPk(serviceData.blogId);
            if (blog.groupId)
            {
                group = await Groups.findByPk(blog.groupId);
                if (!group)
                {
                    throw new Error("هذا الجروب غير موجود")
                }
            }   
        }
    return {serviceData,group};
}





const checkStatsUsers = async(users,user) => {
    try{
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
    }catch(err)
     {
        throw new Error(err.message)
    }
}





const checkGroupStats = async(GroupsData,user) => {
    try{
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
    }catch(err)
    {
        throw new Error(err.message)
    }
}




const checkBlogsStats = async(blogs) => {
    try{
        let groupsIds = blogs.map(blog => blog.groupId).filter(Boolean)
        let groups = await Groups.findAll({where:{id:groupsIds,privacy:'public'}})
     
        let result = blogs.map(blog => {
     
          let checkPriacy = groups.find(group => group.id === blog.groupId)
          if (checkPriacy)
            {
                return checkPriacy
            }  
        })
        return result
    }catch(err)
    {
        throw new Error(err.message)        
    }
}




const checkPenningBlogData = async(data,groupName,blogId) => {
      if (!blogId)
        {
            throw new Error("البينات ليست كامله")
        }
     await checkAcessMore(data,groupName)  
        let blogPenned = await penningBlogs.findOne({where:{blogId}})
        if (!blogPenned)
        {
            throw new Error("هذا المقاله غير موجوده")
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
        throw new Error("هذا الشخص غير موجود")
     }
}



module.exports = {checkIsBlock,addLogger,checkBlogsStats,checkGroupStats,checkStatsUsers,checkData,checkChangeRole,checkPenningBlogData,checkGroupRole,userAction,checkRole,checkAcess,checkGroupData,checkGroup,checkAcessMore,checkReportData,checkDataMessage,checkPhoto,checkBlog,checkAction,checkComment,updateProfileValdtion,checkFriendRequestData}