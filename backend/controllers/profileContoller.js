
const {Profile,friends,User,Blogs,commentStats,commentsBlogs,requestFriend,blocks} = require('../models/Relationships')


const {getBlogs} = require('../service/getBlogs')


const {isUser} =require('../utils/isUser')
const {userRelations} = require('../utils/friendStatus')


const {Op, where} = require('sequelize')

const {valdtionData,checkUserData,valdtionDataUpdate} = require('../utils/auth')
const{updateProfileValdtion,checkPhoto,checkIsBlock} = require('../utils/checkData')





exports.getProfile = async(req,res) => {
    try{
        const{username} = req.params;
        
        if (!username)
        {
            throw new Error("البينات ليست كامله")
        }
        let user = await User.findOne({where:{username}});
        if (!user)
        {
            throw new Error("هذا المستخدم غير موجود او تم حذف حسابه")
        }
        let profileData = await Profile.findOne({where:{userId:user.id}});
      
        let isOwner = false;
      
        if (req.user)
        {
            
              isOwner = profileData.userId === req.user.id
           
        }
        let blogs = await getBlogs(req,res,"profile",user)
        let statusUser = null;
      
        if (!isOwner&& req.user) 
        {      
            const reqUserInstance = await User.findByPk(req.user.id);
            
            statusUser =  await userRelations(reqUserInstance,user)
            await checkIsBlock(reqUserInstance,user)
        }
        
        res.status(200).json({
            ...profileData.toJSON(),
            userData: {
                username: user.username,
                photo: user.photo
            },
            isOwner,
            blogs,
            statusUser
        })
  
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}



exports.addUserData = async(req,res) => {
    try{
        let user =   await  isUser(req.user)
  
        let {username,email,password} = req.body;
       
       let dataAfterChecks =  await updateProfileValdtion(user,username,email,password);
        await valdtionDataUpdate(username,email,user);
        let data = checkUserData(dataAfterChecks)
        
    if (req.file)
    {   
        checkPhoto(req.file)   
        data.photo = req.file.filename;
    }
       
        let userUpdate = await user.update(data)
    
        res.status(200).json({
            userUpdate: {
                id: userUpdate.id,
                username: userUpdate.username,
                email: userUpdate.email,
                photo: userUpdate.photo
            }
        })
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}






exports.requestsFriend = async(userData,friend) => {
        let user =   await  isUser(userData)
        await checkIsBlock(userData,friend)
        let request = await requestFriend.findOne({
                where: {
                    [Op.or]: [
                    { userId: user.id, friendId: friend.id },   
                    { userId: friend.id, friendId: user.id }     
                    ]
                }
                });
         if (request)
            {
                throw new Error("لأ يمكنك ارسال طلبين")
            }       
   
         let friendProfile = await Profile.findOne({where:{userId:friend.id}});        
         let userProfile = await Profile.findOne({where:{userId:user.id}});        
               
        await friendProfile.increment('followers', { by: 1 });
        await userProfile.increment('UserFollows', { by: 1 });
            
      
  
        await user.createSentRequest({friendId:friend.id})
   
}









exports.reject = async(req,res) => {
    try{
        let user = await isUser(req.user)
        const{username,service} = req.body;
        let friend = await User.findOne({where:{username}});
       
        if (!friend)
        {
            throw new Error("هذا الشخص غير موجود")
        }
        
        let friendRequest;
        if (service === 'rejectRequest')
        {
            
            friendRequest = await requestFriend.findOne({where:{friendId:user.id,userId:friend.id}});
            let friendProfile = await Profile.findOne({where:{userId:user.id}});      
            let userProfile = await Profile.findOne({where:{userId:friend.id}})  
            await friendProfile.decrement('followers', { by: 1 });
            await userProfile.decrement('UserFollows',{by:1})
        }
        else
        {
            
            friendRequest = await requestFriend.findOne({where:{friendId:friend.id,userId:user.id}});
            let friendProfile = await Profile.findOne({where:{userId:friend.id}});      
            let userProfile = await Profile.findOne({where:{userId:user.id}})  
            await friendProfile.decrement('followers', { by: 1 });
            await userProfile.decrement('UserFollows',{by:1})
        }
      
        if (!friendRequest)
        {
            throw new Error("هذا الطلب غير موجود")
        }
        await friendRequest.destroy();
        res.status(201).json();
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}



exports.acceptRequest = async(req,res) => {
    try{
        let user = await isUser(req.user)
        const{username} = req.body;
       
        let friend = await User.findOne({where:{username}});    
   
        if (!friend)
        {
            throw new Error("هذا الشخص غير موجود")
        }
        let friendRequest = await requestFriend.findOne({where:{userId:friend.id,friendId:user.id}});
        
        if (!friendRequest )
        {
            throw new Error("هذا الطلب غير موجود")
        }
        else if (friendRequest.friendId != user.id)
        {
            throw new Error("لأ يمكنك قبول طلب انت ارسلته")
        }
         let userProfile = await Profile.findOne({where:{userId:user.id}});  
         let friendProfile = await Profile.findOne({where:{userId:friend.id}});  
        await friendRequest.destroy();  
        await user.createFriend({friendId:friend.id});
        await friendProfile.increment('followers', { by: 1 });
        
        await userProfile.increment('UserFollows', { by: 1 });
        res.status(201).json({})
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}









exports.cancelFriend = async(req,res) => {
    try{
        let user = await isUser(req.user)
        let {username} = req.body;
        let friend = await User.findOne({where:{username}});
        if (!friend)
        {
            throw new Error("هذا الشخص غير موجود")
        }
        let isFriend = await friends.findOne({
                where: {
                    [Op.or]: [
                    { userId: user.id, friendId: friend.id },   
                    { userId: friend.id, friendId: user.id }     
                    ]
                }
        });
         let userProfile = await user.getProfile();  
         let friendProfile = await friend.getProfile();
        await friendProfile.decrement('followers', { by: 1 });
        await userProfile.decrement('followers', { by: 1 });
        await userProfile.decrement('UserFollows',{by:1})
        await friendProfile.decrement('UserFollows',{by:1})
        if (!isFriend)
        {
            throw new Error("انتم لستم اصدقاء بلفعل")
        }
        await isFriend.destroy();
        res.status(201).json({});
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}














exports.blockUser = async(req,res) =>{
    try{
        let user = await isUser(req.user)
        const {username} = req.params;
        if (username === user.username)
        {
            throw new Error("لأ يمكنك حظر نفسك")
        }
        let friend = await User.findOne({where:{username}})
        if (!friend)
        {
            throw new Error("هذا الشخص غير موجود")
        }
              let block = await blocks.findOne({where:{
                [Op.or]:[
                    {recivceBlock:user.id,sentBlock:friend.id},
                    {recivceBlock:friend.id,sentBlock:user.id}

                ]
            }})
        if (block)
        {
            throw new Error("هذا الشخص محظور بلفعل")
        }
        let statusUser =  await userRelations(user,friend)
        if (statusUser.request)
        {
            await statusUser.request.destroy();
        }
        else if (statusUser.isFriends)
        {
            await statusUser.isFriends.destroy();
        }
        let newBlock = await user.createSentBlock({recivceBlock:friend.id})
        res.status(201).json()
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}

exports.cancelBlock = async(req,res) => {
    try{
        let user = await isUser(req.user)
        const {username} = req.params;
        let friend = await User.findOne({where:{username}})
         let block = await blocks.findOne({where:{
                [Op.or]:[
                    {recivceBlock:user.id,sentBlock:friend.id},
                    {recivceBlock:friend.id,sentBlock:user.id}

                ]
            }})

        if (!block)
        {
            throw new Error("انت لم تقم بحظره بلفعل")
        }
      
        await block.destroy();
        res.status(201).json();
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}








exports.getBlocks = async(req,res) => {
    try{
         let user = await isUser(req.user)
         let blocks = await user.getSentBlock();
         let usersBlocksIds = blocks.map(blockUser => blockUser.recivceBlock)
         let usersBlocks = await User.findAll({where:{id:usersBlocksIds},attributes:["id","username","photo"]})
         res.status(200).json({usersBlocks})
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}

exports.removeBlock = async(req,res) => {
    try{
         let user = await isUser(req.user)
         if (!req.body.idBlock)
         {
            throw new Error("البينات ليست كامله")
         }
         const{idBlock} = req.body;
         let blocks = await user.getSentBlock({where:{recivceBlock:idBlock}})
         if (blocks.length < 1)
         {
            throw new Error("هذا الشخص غير موجود")
         }
         await blocks[0].destroy()
         res.status(201).json()
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}








