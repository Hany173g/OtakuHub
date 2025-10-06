


const {hashPassword} = require('./auth')

const{Groups,pendingRequestsGroup,User,loggerGroup,Blogs,friends,commentsBlogs} = require('../models/Relationships')

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
        
        console.log(user)
        if (user.length < 1)
        {
            throw new Error("هذا الشخص غير موجود")
        }
        await group.removePendingUser(user);
        return {group,user}
}






const checkGroupRole = async(groupId,user) => {
       let checkRole;
     if (groupId)
           {
              let group = await Groups.findByPk(groupId);
              if (!group)
                {
                    throw new Error("هذا الجروب الجروب غير موجود")
                }  
              let member = await group.getUsers({through:{where:{userId:user.id, role: { [Op.in]: ['Admin', 'owner', 'Moderator'] } }}})
              if (member.length > 0)
                {
                    checkRole = member[0]
                } 
                else
                {
                    throw new Error("ليس لديك الصلأحيات")
                }
           }
        return checkRole;
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
    await group.addLoggerGroup({userId,status})
}









module.exports = {addLogger,checkData,checkChangeRole,checkGroupRole,userAction,checkRole,checkAcess,checkGroupData,checkGroup,checkAcessMore,checkDataMessage,checkPhoto,checkBlog,checkAction,checkComment,updateProfileValdtion,checkFriendRequestData}