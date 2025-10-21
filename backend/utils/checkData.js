


const {hashPassword} = require('./auth')

const{Groups,penningBlogs,User,blocks,Blogs,bannedUser,friends,commentsBlogs, warringUser,requestFriend, GroupMember, loggerGroup} = require('../models/Relationships')

const {Op, where, Model} = require('sequelize')


const{isUser} = require('./isUser')
const { createError } = require('./createError')




const checkData= ({content,title}) => {
    if (!content||!title)
    {
        throw createError("البينات ليست كامله",400)

    }
    return {content,title}
}



const checkPhoto = (file ) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (file.size > 3000000)
    {
         throw createError("يجب ان يكون الحجم اقصي شي 3 ميجا",400)
    
    }
    else  if (!allowedTypes.includes(file.mimetype)) {
         throw createError("يجب ان يكون الصوره امتداد jpeg or png",400)
       
    }
    
}


const checkGroupData = (groupName,description,photo,privacy,group,bool,bool2 ) => {
    if (!groupName)
    {
           throw createError("يجب وضع اسم لي الجروب",400)
    }
    else if(!description)
    {
          throw createError("يجب وضع وصف لي الجروب",400)
       
    }
    else if (bool)
    {
         if(!photo)
        {
              throw createError("يجب عليك وضع صوره لي الجروب",400)
         
        }
    }
    if (groupName.length < 4 || groupName.length > 19)
    {
            throw createError("يجب ان يكون الجروب اكبر من 3 احرف واقل من 20",400)
       
    }
    else if (description.length < 10 || description.length > 999)
    {
            throw createError("يجب ان يكون الوصف اكبر من 10 حروف واصغر من 1000",400)
    }
    if (bool2)
    {
         if (group)
        {
             throw createError("هذا الأسم مستخدم من قبل",400)
        }
    }
   
    if (privacy != 'private' && privacy != 'public')
    {
          throw createError("هذا القيم غير موجوده",400)
      
    }
    if (bool)
    {
        checkPhoto(photo)  
    }
     
}




const checkGroup = async(userData,groupName ) => {
     let group = await Groups.findOne({where:{name:groupName}});
        if (!group)
        {
               throw createError("هذا الجروب غير موجود",400)
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

const checkBlog = async(id ) => {
        let blog = await Blogs.findByPk(id);
           if (!blog)
           {
               throw createError("هذا المقال غير موجود او تم حذفه",400)
           }
           return blog;
        }


const checkAction = (action ,service ) => {
    if (service != 'comment' && service != 'blogs')
    {
           throw createError('يجب ان تختار حدث معين("comment or blogs")',400)
    }
    if (action != 'like' && action != 'dislike')
    {
          throw reateError('يجب ان تختار حدث معين("like or dislike")',400)
    }
}






const checkBanned = async(userId,groupId ) => {
    let bannedUsers = await bannedUser.findOne({where:{userId,groupId}})
    
    if (bannedUsers)
    {
        throw createError("قام المشرف بحذر دخولك",400)
    }

}





const checkChangeRole = (role,owner,userRole ) => {
    let requesterRole  = owner[0].GroupMember.role;
 
    if (role ==='Admin' && requesterRole !== "owner")
    {
          throw createError("انت لأ تملك الصلأحيه الكافيه",401)
    } 
    else if (requesterRole === userRole)
    {
         throw createError("انت لأ تملك الصلأحيه الكافيه",401)
    }
}





const checkComment = async(id ) => {
    let comment = await commentsBlogs.findByPk(id)
    if (!comment)
    {
          throw createError("هذا التعليق غير موجود او تم حذفه",400)
    }
    return comment;
}



const updateProfileValdtion = async (user, newUsername, newEmail, newPassword ) => {
   
    let username = newUsername || user.username;
    let email = newEmail || user.email;
    let password = newPassword ? await hashPassword(newPassword) : user.password;
   
    return { username, email, password };
};




const checkDataMessage = async(username,content,user ) => 
{
    let friend = await User.findOne({where:{username}});

            if (!friend)
            {
                 throw createError("هذا الشخص غير موجود",400)
            }
            if (content) {
                if (content.length  < 1)
                {
                    throw createError("لأ تستطيع ارسال رساله بدون محتوي",400)
                }
                
            }
            else
            {
               throw  createError("البينات ليست كامله",400)
            }
            let isFriend = await user.getFriends({where:{
                [Op.or]:[
                    {userId:user.id,friendId:friend.id},
                    {userId:friend.id,friendId:user.id}
                ]
         }});
         if (!isFriend)
        {
               throw createError("انتم لستم اصدقاء",400)
        }
    return friend;
}





const checkFriendRequestData = async(userId,friendId ) => {
        let[user,friend] = await Promise.all([
            User.findByPk(userId),
            User.findByPk(friendId),
            
        ])
    if (!user || !friend)
    {
        throw createError("هذا المستخدم غير موجود",400)

    }
  
}





const checkRole = async(role,owner ) => {
    let userRole = owner[0].GroupMember.role;
    if (role === userRole)
    {
        throw createError("انتم الأثنين نفس الصلأحيه",400)
    }
    else if (role === "owner" && userRole === "Admin")
    {
            throw createError("لأ تملك الصلأحيات الكافيه",400)
    }
    else if (role === "Admin" && userRole === "Admin")
    { 
        throw createError("لأ تملك اللصلأحيات الكافيه",400)
    }
}





const checkAcessMore = async(data,groupName ) =>
{
      let user = await isUser(data );
      if (!groupName)
      {
          throw createError("البينات ليست كامله",400)
      }
    let group = await Groups.findOne({where:{name:groupName}});
    if (!group)
    {
        throw createError("هذا الجروب غير موجود",400)
     }
    const owner = await group.getUsers({ 
            through: { where: { role: ['owner','Admin'] ,userId:user.id} } 
        });
        if (owner.length < 1)
        {
            throw createError("لأ تملك صلأحيات لوصل لي هذا البينات",401)
        }
        return {group,user,owner};
}



const userAction = async(groupName,id,data ) => 
{
       if (!id)
        {
            throw createError("البينات ليست كامله",400)
            
        }
       let {group} =  await checkAcessMore(data,groupName)
   
        let user = await group.getPendingUsers({through:{where:{id}}})
        
        
        if (user.length < 1)
        {
            throw createError("هذا الشخص غير موجود",400)
        }
        await group.removePendingUser(user);
        return {group,user}
}






const checkGroupRole = async(blog,user) => {
       let checkRole;
    let groupId = blog.groupId
     if (groupId)
           {
              let group = await Groups.findByPk(groupId);
              
              if (!group)
                {
                     throw createError("هذا الجروب الجروب غير موجود",400)
                }  
              let member = await group.getUsers({through:{where:{userId:user.id, role: { [Op.in]: ['Admin', 'owner', 'Moderator'] } }}})
              let isOwnerBlog = blog.userId === user.id;  
             if (member.length > 0 || isOwnerBlog)
                {
                    checkRole = member[0]
                } 
            else
                {
                     throw createError("ليس لديك الصلأحيات",401)
                }
                 return {checkRole,group};
           }
           return {checkRole}
}











const checkAcess = async(data,groupName ) =>
{
      let user = await isUser(data );
      if (!groupName)
      {
        throw createError("البينات ليست كامله",400)
      }
        let group = await Groups.findOne({where:{name:groupName}});
        if (!group)
        {
             throw createError("هذا الجروب غير موجود",400)
        }
        const owner = await group.getUsers({ 
            through: { where: { role: 'owner' ,userId:user.id} } 
        });
        if (owner.length < 1)
        {
            throw createError("لأ تملك صلأحيات لوصل لي هذا البينات",401)
        }
        return {group,user,owner};
}






const addLogger = async(group,userId,status ) => {
    if (!group || !userId)
    {
          throw createError("البينات ليست كامله",400)
   
    }
    if (!["join", "leave", "newOwner", "kick"].includes(status)) {
       throw createError("هذا القيمه غير موجوده",400)
    }
    let user = await User.findByPk(userId)
    if (!user)
    {
      throw createError("المستخدم غير موجود",400)
    }
    await group.createLoggerGroup({userId,status,photo:user.photo,username:user.username})
}














const checkReportData = async (service, serviceId, user, content, next) => {
    let group = null;
    let serviceData;
    if (!["blog", "comment"].includes(service) || !serviceId) {
        throw createError("البينات غير صحيحه", 400)
    } else if (content.length < 10 || content.length > 150) {
        throw createError("يجب ان يكون حجم البلأغ اكبر من 10 احرف واقل او يساوي من 150 حرف", 400)
    }
    if (service === 'blog') {
        serviceData = await Blogs.findByPk(serviceId);
    } else {
        serviceData = await commentsBlogs.findByPk(serviceId);
    }
    if (!serviceData) {
       throw createError("هذا العنصر غير موجود", 404)
    } else if (serviceData.userId == user.id) {
        throw createError("لأ يمكنك الابلاغ عن شي انت قمت بنشره", 400)
    }
    if (serviceData.groupId) {
        group = await Groups.findByPk(serviceData.groupId);
        if (!group) {
            throw createError("هذا الجروب غير موجود", 404)
        }
    } else if (serviceData.groupId === undefined) {
        let blog = await Blogs.findByPk(serviceData.blogId);
        if (blog.groupId) {
            group = await Groups.findByPk(blog.groupId);
            if (!group) {
               throw createError("هذا الجروب غير موجود", 404)
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




const checkPenningBlogData = async(data,groupName,blogId ) => {
      if (!blogId)
        {
                 throw createError("البينات ليست كامله",400)
        }
     await checkAcessMore(data,groupName)  
        let blogPenned = await penningBlogs.findOne({where:{blogId}})
        if (!blogPenned)
        {
            throw createError("هذا المقاله غير موجوده",400)
        } 
        await blogPenned.destroy()
}











const checkIsBlock = async(user,friend ) => {
        let block = await blocks.findOne({where:{
                [Op.or]:[
                    {recivceBlock:user.id,sentBlock: friend.id},
                    {recivceBlock:friend.id,sentBlock:user.id}

                ]
            }})
     if (block)
     {
            throw createError("هذا الشخص غير موجود",400)
     }
}



const checkUpdateGroupSettingsData = async(publish,allowReports,warringNumbers,groupSettings ) => {
  publish = publish ?? groupSettings.publish;
  warringNumbers = warringNumbers ?? groupSettings.warringNumbers  
  allowReports = allowReports ?? groupSettings.allowReports  
  console.log(typeof warringNumbers)
  console.log(typeof publish)
  console.log(typeof allowReports)
  if (typeof publish !== "boolean"  || typeof allowReports !== "boolean" || typeof warringNumbers !== "number")
  {
    throw createError("البينات غير صحيحه",400)
  }
  else if(warringNumbers < 1 || warringNumbers > 10)
  {
    throw createError("يجب ان يكون العدد اكبر من 1 واقل من 10")
  }

  return {publish,allowReports,warringNumbers}
}



const checkWarringData = (groupName,id ) =>
{
    if (!groupName || !id)
    {
        throw createError("البينات ليست كامله",400)
    }
}











const checkWarringAcess = (warringUser,user ) => {

    if ( user.id == warringUser.id)
    {
         throw createError("لأ يمكنك ارسال تحذير لنفسك",400)
    }
    else if (warringUser.GroupMember.role === "owner")
    {
        throw createError("لأ يمكنك تحذير شخص اعلى منك في الصلأحيه",400)
    }
}



const moderatorsAcess = async(groupName,userId,idWarringBy ) => 
    {
        let group = await Groups.findOne({where:{name:groupName}})
        if (!group)
        {
           throw createError("هذا الجروب غير موجود",400)
        }
   
        let warringUser = await group.getUsers({where:{id:userId}})
        let user = await group.getUsers({where:{id:idWarringBy}})
        if (user.length < 1 || warringUser.length < 1)
        {
           throw createError("انت لست عضو في الجروب",401)
        }
        else if (!["owner","Admin","Moderator"].includes(user[0].GroupMember.role))
        {
            throw createError("انت لأ تملك الصلأحيه",401)
        }
        
        user = user[0]
        warringUser = warringUser[0]
 
        checkWarringAcess(warringUser,user )
        let warringUsers = warringUser
        return {warringUsers,group};
    } 




    const addNewWarring = async(userId,user,groupName,reason ) => 
    {
        let {warringUsers,group} = await moderatorsAcess(groupName,userId,user.id );
       let getWarring =  await group.getWarringUsers({id:warringUsers.id})
         let groupSettings = await group.getGroupSetting();
       if (getWarring.length > 0)
       {
         await getWarring[0].increment('warringNumbers', { by: 1 });
         if (getWarring[0].warringNumbers >= groupSettings.warringNumbers)
         {
              await GroupMember.destroy({
                where:{
                    userId:warringUsers.id,
                    groupId:group.id
                }
            })
            await getWarring[0].destroy()  
             await bannedUser.create({userId:userId, groupId:group.id});
           
         }
       
         
       }
       else
       {
       let newWarring =  await warringUser.create({
            userId,
            groupId:group.id,
            warringNumbers: 1,
            reason,
            warnedBy:user.id
        })
        getWarring = [newWarring]
       }
       console.log(getWarring)
       console.log(getWarring[0].warringNumbers >= groupSettings.warringNumbers)
       if (getWarring[0].warringNumbers >= groupSettings.warringNumbers)
       {
         await group.decrement('numberMembers', { by: 1 });
        await addLogger(group,user.id,"kick")
       }
       let warringNumbers = groupSettings.warringNumbers
      let userWarring = getWarring.length > 0 ? getWarring[0].warringNumbers : 1;
       return {warringNumbers,userWarring}
    }





const getBannedUsers = async(group) => {
    let bannedUsers = await group.getBannedUsers({include:{
        model:User,
        attributes:["id","username","photo"]
    },order:[['createdAt','DESC']]});
    return bannedUsers
}








const removeBanUser = async(group,id ) => {
    let banUser = await group.getBannedUsers({where:{id}})
    if (banUser.length < 1)
    {
        throw createError("هذا الشخص ليس محظور بلفعل",400)
    }
    await banUser[0].destroy()
}




const getLoggerUser = async(group,username,status ) => 
{
 
    if (!username)
    {
        throw createError("البينات ليست كامله",400)
    }
    else if (!["join", "leave", "newOwner", "kick","all"].includes(status)) {
        throw createError("هذا القيمه غير موجوده",400)
    }
    let userLogger;
    if (status == "all")
    {
        userLogger = group.getLoggerGroup({where:{username}})
    }
    else
    {
         userLogger = group.getLoggerGroup({where:{username,status}})
    }
    return userLogger
}




const getUserBanned = async(group,username) => {
    let user = await User.findOne({where:{username}})
    if (!user)
    {
        throw createError("لأ يوجد نتائج",400)
    }
    let userBan = await group.getBannedUsers({where:{userId:user.id},include:{
        model:User,
        attributes:["id","username","photo"]
    },order:[['createdAt','DESC']]})
    return userBan;
}




const getUserPenningBlogs = async(group,username) => {
     let user = await User.findOne({where:{username}})
    if (!user)
    {
       throw  createError("لأ توجد نتائج",400)
    }
    let penningBlogs = await group.getPenningBlogs({where:{userId:user.id},include:{
        model:Blogs,
        attributes:["id","title","content","photo"]
    },order:[['createdAt','DESC']]})
    return penningBlogs;
}



const getUserReports = async(group,username,service) => {
 
     if (!["blog","comment"].includes(service))
            {
               throw  createError("هذا القيمه غير موجوده",400)
            }
     let serivceModel = service === "blog" ? Blogs : commentsBlogs
        const attributesMap = {
        blog: ['id', 'title', 'photo', 'content'],
        comment: ['id', 'content', 'createdAt']
        };
        let user = await User.findOne({where:{username}});
        if (!user)
        {
            throw createError("لأ يوجد نتائج",400)
        }
        let groupReports = await group.getReports({where:{service,userId:user.id},
            include:[
            {
                model:User,
                attributes:["id","username","photo"]
            },
            {
              model:serivceModel,
              attributes:attributesMap[service],
              include:[
                {
                    model:User
                }
              ]
            }
        ],order:[['createdAt','DESC']]});
    return groupReports;
}










const getHistoryDeleteUser = async(group,username,service) => {
        let model = service === 'posts' ? Blogs : commentsBlogs
     
         if (!service ||!['blog','comment'].includes(service))
        {
            throw createError("البينات ليست كامله",400)
        }
        let historyDelete = await group.getHistoryDeleteGroups({where:{service,administratorDelete:username },order:[['createdAt','DESC']]})
        return historyDelete;
}












const checkAddFav = async(user,blogId) => {
      if (!blogId)
            {
                throw createError("البينات ليست كامله",400)
            }  
           
          let blog = await Blogs.findByPk(blogId)
          if (!blog)
          {
            throw createError("هذا المنشور غير موجود",400)
          }
          let isFav = await user.getFavorites({where:{blogId}});
          if (isFav.length > 0)
          {
            throw createError("تم اضافته الى المفضله بلفعل",400)
          }
          return isFav
} 










const changeWarringNumbers = async(group) => {
   await warringUser.destroy({
    where: { groupId: group.id }
  });
}




const checkBlogGroup = async(user,Favorites) => {
    const userGroups = await GroupMember.findAll({where:{userId:user.id},attributes:["groupId"],raw:true})
      const groupsIds = userGroups.map(g => g.groupId);
    let result = Favorites.map(fav => {
        let isAccess = true
        let favPlain = fav.get({plain:true})
        let isGroup = favPlain.Blog.Group;

       if (isGroup)
        {
               console.log(1)
            if (isGroup.privacy === "private")
            {
                isAccess = groupsIds.includes(isGroup.id)
                console.log(isAccess)
            }
            else
            {
                  return fav
            }
            if (isAccess)
            {
                return fav
            }
        } 
        else
        {
            return fav
        }
        
    } )
    return result
}






module.exports = {checkAddFav,checkBlogGroup,changeWarringNumbers,getHistoryDeleteUser,getBannedUsers,getUserReports,getUserPenningBlogs,getUserBanned,getLoggerUser,removeBanUser,checkIsBlock,checkBanned,addNewWarring,moderatorsAcess,checkWarringData,addLogger,checkUpdateGroupSettingsData,checkBlogsStats,checkGroupStats,checkStatsUsers,checkData,checkChangeRole,checkPenningBlogData,checkGroupRole,userAction,checkRole,checkAcess,checkGroupData,checkGroup,checkAcessMore,checkReportData,checkDataMessage,checkPhoto,checkBlog,checkAction,checkComment,updateProfileValdtion,checkFriendRequestData}