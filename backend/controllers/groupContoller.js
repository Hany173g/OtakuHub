const{User,Blogs,GroupMember,historyDeleteGroup,pendingRequestsGroup,Groups,nestedComments,dislikesBlogs,BlogStats, commentsBlogs, commentStats, likesComments, likesBlogs, dislikeComments} = require('../models/Relationships')


const {isUser} =require('../utils/isUser')
const {checkGroupData,checkGroup,checkRole,addLogger, checkGroupRole,checkChangeRole,checkAcess,userAction, checkAcessMore} =require('../utils/checkData')
const {Like_Dislike} = require('../utils/stats')


const {getBlogs} = require('../service/getBlogs')
const {createBlog} = require('../service/blogService')




const sequelize = require('../config/database');
const { where } = require('sequelize')










exports.getAllGroups = async(req,res) => {
    try{
        let groups = await Groups.findAll({
            attributes: ['id', 'name',  'privacy', 'photo', 'numberMembers', 'createdAt']
        });
        res.status(200).json({groups})
    }catch(err) 
    {
        res.status(400).json({message:err.message})
    }
}

exports.createGroup = async(req,res) => {
    try{
        let user = await isUser(req.user);
        const {groupName,description,privacy} = req.body;
         let group = await Groups.findOne({where:{name:groupName}});
        checkGroupData(groupName,description,req.file,privacy,group,true,true)  
        let newGroup = await Groups.create({
            description,
            privacy,
            photo: req.file.filename,
            name:groupName,
        })
        await newGroup.addUser(user, { through: { role: 'owner' } })
    res.status(201).json({newGroup})
    }catch(err) 
    {
        res.status(400).json({message:err.message})
    }
}









exports.joinGroup = async(req,res) =>{
    try{
        let user = await isUser(req.user);
        const {groupName}  = req.body;
    
        let group = await Groups.findOne({where:{name:groupName}});
        if (!group)
        {
            throw new Error("هذا الجروب غير موجود")
        }
    
        let checkUser = await group.getUsers({where:{id:user.id}});
        if (checkUser.length > 0)
        {
            throw new Error("انت عضو في الجروب بلفعل")
        } 
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
        res.status(400).json({message:err.message})
    }
}




exports.addPost = async(req,res) =>{
    try{
        let user = await isUser(req.user);
        const {groupName,content,title}  = req.body;
         let data =  await checkGroup(req.user,groupName);
        let group = data.group;
        let checkUser = data.checkUser;
        if (checkUser.length < 1)
        {
            throw new Error("انت لست عضو في الجروب ")
        } 
      let newBlog =   await createBlog(req.body,req.file,user,group.id)
        res.status(201).json({blogData:newBlog})
    }catch(err)
    {
        res.status(200).json({message:err.message})
    }
}


exports.getGroup = async(req,res) => {
    try{
        const {groupName} = req.body;
       let data =  await checkGroup(req.user,groupName);
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

        res.status(200).json({groupData})
    }catch(err)
    {
        res.status(200).json({message:err.message})
    }
}



















exports.leaveGroup = async(req,res) => {
    try{
        let user = await isUser(req.user);
        const{groupName} = req.body;
        let data = await checkGroup(req.user,groupName)
        let group = data.group;
        let checkUser = data.checkUser;
        if (checkUser.length < 1)
        {
            throw new Error("انت لست عضو بلفعل")
        }
       
        if (checkUser[0].GroupMember.role === "owner")
        {
            throw new Error("المالك لا يمكنه مغادرة الجروب. يجب نقل الملكية أولًا")
        }
        await group.removeUser(user)
        await group.decrement('numberMembers', { by: 1 });
         await addLogger(group,user.id,"leave")
        res.status(200).json()
    }catch(err)
    {
        res.status(200).json({message:err.message})
    }
}






exports.cancelJoinGroup = async(req,res) => {
    try{
          let user = await isUser(req.user);
          const{groupName} = req.body;
           let group = await Groups.findOne({where:{name:groupName}});
            if (!group)
            {
                throw new Error("هذا الجروب غير موجود")
            }
    
        let checkUser = await group.getPendingUsers({where:{id:user.id}});
        if (checkUser.length === 0)
        {
            throw new Error("تم الغاء الطلب بلفعل")
        }
        await group.removePendingUser(user);
        
        res.status(200).json()
    }catch(err)
    {
        res.status(400).json({message:err.message})   
    }
}






exports.getPendingUsers  = async(req,res) => {
    try{
       const{groupName} = req.query;
        let data = await checkAcessMore(req.user,groupName)
        let group = data.group;
        let pendingUsers = await group.getPendingUsers({
            attributes: ['id', 'username', 'photo']
        });

        const formattedUsers = pendingUsers.map(user => {
            const plainUser = user.get({ plain: true });
           console.log(plainUser)
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
        res.status(400).json({message:err.message})
    }
}




exports.acceptUser = async(req,res) => {
    try{
        const{groupName,id} = req.body;
  
        let data = await userAction(groupName,id,req.user);
        let group = data.group;
        let user = data.user;
        await addLogger(group,user[0].id,"join")
        await group.addUser(user)
        await group.increment('numberMembers', { by: 1 });
 
        res.status(201).json()  
    }catch(err)
    {
        console.log(err.message)
        res.status(400).json({message:err.message})
    }
}







exports.cancelUser = async(req,res) => {
    try{
        const{groupName,id} = req.body;

         await userAction(groupName,id,req.user);

        res.status(201).json();
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}


exports.isAccess = async(req,res) => {
    try{
        const {groupName} = req.query;
        await checkAcessMore(req.user,groupName);
        res.status(200).json()
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}





exports.getPendingUser = async(req,res) => {
    try{
        const{username,groupName} = req.body;

        let {group} = await checkAcessMore(req.user,groupName);
   
        if (!username)
        {
            throw new Error("البينات ليست كامله")
        }
        let user = await User.findOne({where:{username}});
        console.log('User found:', user ? user.username : 'null');
        if (!user)
        {
            throw new Error("هذا الشخص غير موجود")
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
            throw new Error("هذ الشخص غير موجود")
        }
   
        res.status(200).json(filterPendingUser) 
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}

















exports.searchMembers = async(req,res) => {
    try{
        const{username,groupName} = req.body;
        let data = await checkAcessMore(req.user,groupName);
        if (!username)
        {
            throw new Error("البينات ليست كامله")
        }
        let group = data.group;
        let user = await User.findOne({where:{username}});
        if (!user)
        {
            throw new Error("هذا الشخص غير موجود")
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
            throw new Error("هذ الشخص غير موجود")
        }
    res.status(200).json({filterMember})
    }catch(err)
    {
         res.status(400).json({message:err.message})
    }
}













exports.changeRole = async(req,res) => {
    try{
          const{username,groupName,newRole} = req.body;
        let data = await checkAcessMore(req.user,groupName);
        let role = data.owner;
        if (!username  || !newRole)
        {
            throw new Error("البينات ليست كامله")
        }
    
        let group = data.group;
        let user = await User.findOne({where:{username}});
        if (!user)
        {
            throw new Error("هذا الشخص غير موجود")
        }
        if (newRole != 'Member' && newRole != 'Admin' && newRole != 'Moderator')
        {
            throw new Error("هذا القيمه غير موجوده")
        }
        let userUpdate = await group.getUsers({through:{where:{userId:user.id}}});
        if (userUpdate.length < 1)
        {
            throw new Error("هذا الشخص ليس عضوء في الجروب")
        }
        checkChangeRole(newRole,role,userUpdate[0].GroupMember.role)
        await userUpdate[0].GroupMember.update({role:newRole})
        res.status(200).json()
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}







exports.kickUser = async(req,res) => {
    try{
        const {username,groupName} = req.body;
        if (!username || !groupName)
        {
            throw new Error("البينات ليست كامله")
        }
        let data = await checkAcessMore(req.user,groupName);
        let group = data.group;
        let owner = data.owner;

        let user = await User.findOne({where:{username}});
        if (!user)
        {
            throw new Error("هذا الشخص غير موجود")
        }
        let kickUser = await group.getUsers({through:{where:{userId:user.id}}});
       if (kickUser.length < 1)
       {
            throw new Error("هذا الشخص ليس عضو بلفعل")
       }
 
       await checkRole(kickUser[0].GroupMember.role,owner)
        await kickUser[0].GroupMember.destroy();
        await group.decrement('numberMembers', { by: 1 });
         await addLogger(group,user.id,"kick")
        res.status(201).json()
    }catch(err)
    {
        res.status(400).json({message:err.message})
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








exports.updateGroupData = async(req,res) => {
    try{
        const{groupName,description,privacy} = req.body;
        let data = await checkAcess(req.user,groupName);
        let group = data.group;
   
       const {desc,priv}= checkUpdateGroup(description,privacy,group)
       if (req.file)
        {
            checkGroupData(groupName,desc,req.file,priv,group,true,false)  
            await group.update({description:desc,privacy:priv,photo:req.file.filename})
        }  
        else
        {
            checkGroupData(groupName,desc,null,priv,group,false,false)  
             await group.update({description:desc,privacy:priv})
        }
       res.status(200).json();
    }catch(err)
    {
        console.log(err.message)
        res.status(400).json({message:err.message})
    }
}













exports.deleteGroup = async(req,res) => {
    try{
        let {groupName} = req.body;
       let data =  await checkAcess(req.user,groupName)
       let group = data.group;
       await group.destroy();
       res.status(201).json()
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}








exports.changeOwner = async(req,res) => {
        const t = await sequelize.transaction();
    try{
        const{newOwner,groupName} = req.body;
         if (!newOwner)
        {
            throw new Error("البينات ليست كامله")
        }
        let data =  await checkAcess(req.user,groupName)
        let owner = data.owner;
        let group = data.group;
        let checkUserGroup = await group.getUsers({through:{where:{userId:newOwner}}})
        if (checkUserGroup.length < 1)
        {
            throw new Error("هذا الشخص ليس عضو في الجروب")
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
        res.status(400).json({message:err.message})
    }
}







exports.getGroupLogger = async(req,res) => {
    try{
        const {status} = req.params;
        const{groupName} = req.body;
        console.log(status)
        if (!status)
        {
            throw new Error("البينات ليست كامله")
        }
        else if (!["join", "leave", "newOwner", "kick"].includes(status)) {
            throw new Error("هذا القيمه غير موجوده")
        }
         let data =  await checkAcessMore(req.user,groupName)
         let group = data.group;
         let logger = await group.getLoggerGroup({where:{status}});
         const userIds = logger.map(log => log.userId);
         let users = await User.findAll({where:{id:userIds}});
            
         res.status(200).json({logger,users})
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}



exports.getHistoryDelete = async(req,res) => {
    try{
        const {service} = req.params;
        const {groupName} = req.body;
        if (!service ||!groupName ||!['posts','comments'].includes(service))
        {
            throw new Error("البينات ليست كامله")
        }
        let data =  await checkAcessMore(req.user,groupName)
        let group = data.group
        
        // Map frontend service names to database service names
        const serviceMapping = {
          'posts': 'blog',
          'comments': 'comment'
        }
        const dbService = serviceMapping[service] || service
        
        let historyDelete = await group.getHistoryDeleteGroups({service: dbService})
        
        res.status(200).json({historyDelete})
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}






