const{User,Blogs,GroupMember,historyDeleteGroup,penningBlogs,warringGroup,groupSettings,pendingRequestsGroup,Groups,report,nestedComments,dislikesBlogs,BlogStats, commentsBlogs, commentStats, likesComments, likesBlogs, dislikeComments} = require('../models/Relationships')


const {isUser} =require('../utils/isUser')
const {checkGroupData,checkWarringData,moderatorsAcess,getLoggerUser,removeBanUser,checkBanned,addNewWarring,checkUpdateGroupSettingsData,getBannedUsers,checkGroup,checkRole,addLogger, checkPenningBlogData,checkGroupRole,checkChangeRole,checkAcess,userAction, checkAcessMore} =require('../utils/checkData')
const {Like_Dislike} = require('../utils/stats')


const {getBlogs} = require('../service/getBlogs')
const {createBlog} = require('../service/blogService')



const {createError} = require('../utils/createError')



const sequelize = require('../config/database');
const { where, Model } = require('sequelize')










exports.getAllGroups = async(req,res,next) => {
    try{
        let groups = await Groups.findAll({
            attributes: ['id', 'name',  'privacy', 'photo', 'numberMembers', 'createdAt']
        });
        res.status(200).json({groups})
    }catch(err) 
    {
         next(err)
    }
}

exports.createGroup = async(req,res,next) => {
    try{
        let user = await isUser(req.user,next);
        const {groupName,description,privacy} = req.body;
         let group = await Groups.findOne({where:{name:groupName}});
        checkGroupData(groupName,description,req.file,privacy,group,true,true,next)  
        let newGroup = await Groups.create({
            description,
            privacy,
            photo: req.file.filename,
            name:groupName,
        })
        await newGroup.createGroupSetting()
        await newGroup.addUser(user, { through: { role: 'owner' } })
        res.status(201).json({newGroup})
    }catch(err) 
    {
         next(err)
    }
}






exports.joinGroup = async(req,res,next) =>{
    try{
        let user = await isUser(req.user,next);
        const {groupName}  = req.body;
    
        let group = await Groups.findOne({where:{name:groupName}});
        if (!group)
        {
            throw  createError("هذا الجروب غير موجود",400)
            
        }
        let checkUser = await group.getUsers({where:{id:user.id}});
        if (checkUser.length > 0)
        {
             throw  createError("انت عضو في الجروب بلفعل",400)
           
        } 

        await checkBanned(user.id,group.id,next)
        if (group.privacy == 'public')
        {
            await group.addUser(user)
            await group.increment('numberMembers', { by: 1 });
        }
        else
        {
            await group.addPendingUser(user);
        }
       
        res.status(200).json()
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}




exports.addPost = async(req,res,next) =>{
    try{
        let user = await isUser(req.user,next);
        const {groupName}  = req.body;
         let data =  await checkGroup(req.user,groupName,next);
        let group = data.group;
        let checkUser = data.checkUser;
        if (checkUser.length < 1)
        {
             throw  createError("انت لست عضو في الجروب",400)
        } 
        let {newBlog,groupSetting} =   await createBlog(req.body,req.file,user,group.id,next)

        res.status(201).json({blogData:newBlog,groupSettingPublish:groupSetting.publish})
    }catch(err)
    {
       next(err)
    }
}

exports.getGroup = async(req,res,next) => {
    try{
        const {groupName} = req.body;
      
       let data =  await checkGroup(req.user,groupName,next);
       let group = data.group;

       let checkUser = data.checkUser;
       let user = data.user;
         let groupData;
          groupData = group.get({ plain: true });
        if (group.privacy === 'private')
        {          
            if (!(checkUser.length === 0))
            {
                 groupData.Blogs = await getBlogs(req,res,'group',user,group) 
            }   
        }
       else
        {       
            groupData.Blogs = await getBlogs(req,res,'group',user,group)
        }
          groupData.role = "guest"
        if (req.user)
        {     
            if (checkUser.length > 0)
            {
                let userPlain = checkUser.map(member => member.get({plain:true}))
                groupData.role = userPlain[0].GroupMember.role
            }    
            let isRequest = await group.getPendingUsers({userId:user.id});
     
            groupData.isRequest = isRequest.length > 0
        }
       const owner = await group.getUsers({ 
            through: { where: { role: 'owner' } } 
        });
            groupData.ownerGroup = [owner[0].username,owner[0].photo]
        let groupSettings = await group.getGroupSetting();
        res.status(200).json({groupData,groupSettings})
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}



















exports.leaveGroup = async(req,res,next) => {
    try{
        let user = await isUser(req.user,next);
        const{groupName} = req.body;
        let data = await checkGroup(req.user,groupName,next)
        let group = data.group;
        let checkUser = data.checkUser;
        if (checkUser.length < 1)
        {
           throw createError("انت لست عضو بلفعل",400)
        }
       
        if (checkUser[0].GroupMember.role === "owner")
        {
              throw createError("المالك لا يمكنه مغادرة الجروب. يجب نقل الملكية أولًا",400)
        }
        await group.removeUser(user)
        await group.decrement('numberMembers', { by: 1 });
         await addLogger(group,user.id,"leave")
        res.status(200).json()
    }catch(err)
    {
       next(err)
    }
}






exports.cancelJoinGroup = async(req,res,next) => {
    try{
          let user = await isUser(req.user,next);
          const{groupName} = req.body;
           let group = await Groups.findOne({where:{name:groupName}});
            if (!group)
            {
                throw  createError("هذا الجروب غير موجود",400)

            }
    
        let checkUser = await group.getPendingUsers({where:{id:user.id}});
        if (checkUser.length === 0)
        {
             throw  createError("تم الغاء الطلب بلفعل",400)
          
        }
        await group.removePendingUser(user);
        
        res.status(200).json()
    }catch(err)
    {
        next(err)
    }
}






exports.getPendingUsers  = async(req,res,next) => {
    try{
       const{groupName} = req.query;
        let data = await checkAcessMore(req.user,groupName,next)
        let group = data.group;
        let pendingUsers = await group.getPendingUsers({
            attributes: ['id', 'username', 'photo']
        });

        const formattedUsers = pendingUsers.map(user => {
            const plainUser = user.get({ plain: true });
      
            return {
                userId: plainUser.id,
                requestId: plainUser.pendingRequestsGroup.id,
                username: plainUser.username,
                photo: plainUser.photo
            };
        });
  
        res.status(200).json({pendingUser: formattedUsers})
    }catch(err)
    {
        next(err)
    }
}




exports.acceptUser = async(req,res,next) => {
    try{
        const{groupName,id} = req.body;
  
        let data = await userAction(groupName,id,req.user,next);
        let group = data.group;
        let user = data.user;
        await addLogger(group,user[0].id,"join")
        await group.addUser(user)
        await group.increment('numberMembers', { by: 1 });
 
        res.status(201).json()  
    }catch(err)
    {
       next(err)
    }
}







exports.cancelUser = async(req,res,next) => {
    try{
        const{groupName,id} = req.body;

         await userAction(groupName,id,req.user,next);

        res.status(201).json();
    }catch(err)
    {
       next(err)
    }
}


exports.isAccess = async(req,res,next) => {
    try{
        const {groupName} = req.query;
        await checkAcessMore(req.user,groupName,next);
        res.status(200).json()
    }catch(err)
    {
        next(err)
    }
}





exports.getPendingUser = async(req,res,next) => {
    try{
        const{username,groupName} = req.body;

        let {group} = await checkAcessMore(req.user,groupName,next);
   
        if (!username)
        {
              throw createError("البينات ليست كامله",400)
        }
        let user = await User.findOne({where:{username}});
     
        if (!user)
        {
            throw createError("هذا الشخص غير موجود",400)
         
        }
        let pendingUser = await group.getPendingUsers({through:{where:{userId:user.id}},   attributes: ['id', 'username', 'photo']});
        let filterPendingUser = pendingUser.map(user => {
            let plainUser = user.get({plain:true});
            return{
                userId:plainUser.id,
                requestId: plainUser.pendingRequestsGroup.id,
                username: plainUser.username,
                photo: plainUser.photo
            }
        })
        if (filterPendingUser.length < 1)
        {
           throw createError("هذا الشخص غير موجود",400)
        }
   
        res.status(200).json(filterPendingUser) 
    }catch(err)
    {
       next(err)
    }
}

















exports.searchMembers = async(req,res,next) => {
    try{
        const{username,groupName} = req.body;
        let data = await checkAcessMore(req.user,groupName,next);
        if (!username)
        {
           throw  createError("البينات ليست كامله",400)
        }
        let group = data.group;
        let user = await User.findOne({where:{username}});
        if (!user)
        {
            throw createError("هذا الشخص غير موجود",400)
        }
        let member = await group.getUsers({through:{where:{userId:user.id}},   attributes: ['id', 'username', 'photo']});
        let filterMember = member.map(user => {
            let plainUser = user.get({plain:true});
          
            return{
                userId:plainUser.id,
                requestId: plainUser.GroupMember.id,
                username: plainUser.username,
                photo: plainUser.photo,
                role: plainUser.GroupMember.role
            }
        })
         if (filterMember.length < 1)
        {
            throw createError("هذا الشخص غير موجود",400)
        }
    res.status(200).json({filterMember})
    }catch(err)
    {
        next(err)
    }
}













exports.changeRole = async(req,res,next) => {
    try{
          const{username,groupName,newRole} = req.body;
        let data = await checkAcessMore(req.user,groupName,next);
        let role = data.owner;
        if (!username  || !newRole)
        {
            throw createError("البينات ليست كامله",400)
        }
    
        let group = data.group;
        let user = await User.findOne({where:{username}});
        if (!user)
        {
            throw createError("هذا الشخص غير موجود",400)
        }
        if (newRole != 'Member' && newRole != 'Admin' && newRole != 'Moderator')
        {
             throw createError("هذا القيمه غير موجوده",400)
           
        }
        let userUpdate = await group.getUsers({through:{where:{userId:user.id}}});
        if (userUpdate.length < 1)
        {
             throw createError("هذا الشخص ليس عضوء في الجروب",401)
        
        }
        checkChangeRole(newRole,role,userUpdate[0].GroupMember.role,next)
        await userUpdate[0].GroupMember.update({role:newRole})
        res.status(200).json()
    }catch(err)
    {
        next(err)
    }
}







exports.kickUser = async(req,res,next) => {
    try{
        const {username,groupName} = req.body;
        if (!username || !groupName)
        {
        throw createError("البينات ليست كامله",400)
        }
        let data = await checkAcessMore(req.user,groupName,next);
        let group = data.group;
        let owner = data.owner;

        let user = await User.findOne({where:{username}});
        if (!user)
        {
              throw createError("هذا الشخص غير موجود",400)
        }
        let kickUser = await group.getUsers({through:{where:{userId:user.id}}});
       if (kickUser.length < 1)
       {
        throw createError("هذا الشخص ليس عضو بلفعل",400)
        
       }
       await checkRole(kickUser[0].GroupMember.role,owner,next)
        await kickUser[0].GroupMember.destroy();
        await group.decrement('numberMembers', { by: 1 });
         await addLogger(group,user.id,"kick")
        res.status(201).json()
    }catch(err)
    {
        next(err)
    }
}



const checkUpdateGroup = (description,privacy,group) =>{
    if (!description)
    {
        description = group.description;
    }
    if (!privacy)
    {
        privacy = group.privacy;
    }
   let desc = description;
   let priv = privacy;
    return{desc,priv}
}








exports.updateGroupData = async(req,res,next) => {
    try{
        const{groupName,description,privacy} = req.body;
        let data = await checkAcess(req.user,groupName);
        let group = data.group;
   
       const {desc,priv}= checkUpdateGroup(description,privacy,group,next)
       if (req.file)
        {
            checkGroupData(groupName,desc,req.file,priv,group,true,false,next)  
            await group.update({description:desc,privacy:priv,photo:req.file.filename})
        }  
        else
        {
            checkGroupData(groupName,desc,null,priv,group,false,false,next)  
             await group.update({description:desc,privacy:priv})
        }
       res.status(200).json();
    }catch(err)
    {
      next(err)
    }
}













exports.deleteGroup = async(req,res,next) => {
    try{
        let {groupName} = req.body;
       let data =  await checkAcess(req.user,groupName,next)
       let group = data.group;
       await group.destroy();
       res.status(201).json()
    }catch(err)
    {
       next(err)
    }
}








exports.changeOwner = async(req,res,next) => {
        const t = await sequelize.transaction();
    try{
        const{newOwner,groupName} = req.body;
         if (!newOwner)
        {
           throw createError("البينات ليست كامله",400)
        }
        let data =  await checkAcess(req.user,groupName,next)
        let owner = data.owner;
        let group = data.group;
        let checkUserGroup = await group.getUsers({through:{where:{userId:newOwner}}})
        if (checkUserGroup.length < 1)
        {
            throw createError("هذا الشخص ليس عضو في الجروب",400)
        
        }
     
        await owner[0].GroupMember.update({role:"member"},{transaction:t});
        await checkUserGroup[0].GroupMember.update({role:"owner"},{transaction:t})
        console.log(owner[0].GroupMember.role)
        console.log(checkUserGroup[0].GroupMember.role)
        await addLogger(group,checkUserGroup[0].id,"newOwner")
        await t.commit();
        res.status(201).json();
    }catch(err)
    {
        await t.rollback(); 
        next(err)
    }
}







exports.getGroupLogger = async(req,res,next) => {
    try{
        const {status} = req.params;
        const{groupName} = req.body;
        if (!status)
        {
             throw createError("البينات ليست كامله",400)
        }
        else if (!["join", "leave", "newOwner", "kick"].includes(status)) {
           throw createError("هذا القيمه غير موجوده",400)
        }
         let data =  await checkAcessMore(req.user,groupName,next)
         let group = data.group;
         let logger = await group.getLoggerGroup({where:{status}});
         const userIds = logger.map(log => log.userId);
         let users = await User.findAll({where:{id:userIds}});
            
         res.status(200).json({logger,users})
    }catch(err)
    {
       next(err)
    }
}




exports.searchLogger = async(req,res,next) => {
    try{
        let {groupName,username,status} = req.body;
        let {group} =  await checkAcessMore(req.user,groupName,next)
        let loggerUser = await getLoggerUser(group,username,status,next)
        res.status(200).json({loggerUser})
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}










exports.getHistoryDelete = async(req,res,next) => {
    try{
        const {service} = req.params;
        const {groupName} = req.body;
        if (!service ||!groupName ||!['posts','comments'].includes(service))
        {
            return createError("البينات ليست كامله",400)
        }
        let data =  await checkAcessMore(req.user,groupName,next)
        let group = data.group
        
       
        const serviceMapping = {
          'posts': 'blog',
          'comments': 'comment'
        }
        const dbService = serviceMapping[service] || service
        
        let historyDelete = await group.getHistoryDeleteGroups({service: dbService})
        
        res.status(200).json({historyDelete})
    }catch(err)
    {
        next(err)
    }
}



exports.getReportsGroup = async(req,res,next) => {
    try{
        const {groupName,service} = req.body;
        if (!["blog","comment"].includes(service))
        {
           return  createError("هذا القيمه غير موجوده",400)
        }
        let data =  await checkAcessMore(req.user,groupName,next)
        let group = data.group
        let serivceModel = service === "blog" ? Blogs : commentsBlogs
        const attributesMap = {
        blog: ['id', 'title', 'photo', 'content'],
        comment: ['id', 'content', 'createdAt']
        };
        let groupReports = await group.getReports({where:{service},
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
        ]});
        res.status(200).json({groupReports})
    }catch(err)
    {
       next(err)
    }
}





exports.updateGroupSettings = async(req,res,next) => {
    try{
        const {groupName,publish,allowReports,warringNumbers} = req.body;
          
        let {group} = await checkAcessMore(req.user,groupName,next)   
      
        let groupSettings = await group.getGroupSetting();
        if (!groupSettings)
        {
           await group.createGroupSetting()
        }
        
        let data = await checkUpdateGroupSettingsData(publish,allowReports,warringNumbers,groupSettings,next)
       let newSettings =  await groupSettings.update(data)
        res.status(201).json(newSettings)
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}

exports.getBlogsPenning = async(req,res,next) => {
    try{
        const{groupName} = req.body;
        let {group} = await checkAcessMore(req.user,groupName,next)   
        const penningBlogs = await group.getPenningBlogs();
        console.log(penningBlogs)
        const penningBlogsIds = penningBlogs.map(blog => blog.blogId)
        let blogs = await group.getBlogs({where:{id:penningBlogsIds}})
        res.status(200).json({blogs})
    }catch(err)
    {
        next(err)
    }
}






exports.acceptBlogPenned = async(req,res,next) => {
    try{
        const {groupName,blogId} = req.body;
      
          await checkPenningBlogData(req.user,groupName,blogId,next)
      
        res.status(200).json({message: 'تم قبول المنشور بنجاح'})
    }catch(err)
    {
       next(err)
    }
}


exports.cancelBlogPenned = async(req,res,next) => {
    try{
        const {groupName,blogId} = req.body;
          await checkPenningBlogData(req.user,groupName,blogId,next)
        console.log(blogId)
        let blog = await Blogs.findByPk(blogId)
        if (!blog)
        {
              throw createError("هذا المقاله غير موجوده",400)
        }

        await blog.destroy();
        res.status(200).json({message: 'تم رفض المنشور بنجاح'})
    }catch(err)
    {
        next(err)
    }
}






exports.addWarring = async(req,res,next) => {
    try{
       let user = await isUser(req.user,next); 
       const{groupName,userId,message} = req.body;
       checkWarringData(groupName,userId,next)
       let reason = message ?? "لم يتم تحديد سبب"
       await addNewWarring(userId,user,groupName,reason,next)
       res.status(201).json()
    }catch(err)
    {
        next(err)
    }
}










exports.getBannedUsers = async(req,res,next) => {
    try{
        
        let {groupName} = req.body;
        let {group} = await checkAcessMore(req.user,groupName,next)   
        let bannedGroupUsers = await getBannedUsers(group);
        res.status(200).json({bannedGroupUsers})
    }catch(err)
    {
        next(err)
    }
}











exports.removeBannedUser = async(req,res,next) => {
    try{
        let {groupName,id}  = req.body;
        let {group} = await checkAcessMore(req.user,groupName,next)   
        await removeBanUser(group,id,next);
        res.status(201).json();
    }catch(err)
    {

    }
}








