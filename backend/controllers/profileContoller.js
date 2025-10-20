
const {Profile,friends,User,Blogs,commentStats,commentsBlogs,requestFriend,blocks} = require('../models/Relationships')


const {getBlogs} = require('../service/getBlogs')


const {isUser} =require('../utils/isUser')
const {userRelations} = require('../utils/friendStatus')


const {Op, where} = require('sequelize')

const {valdtionData,checkUserData,valdtionDataUpdate} = require('../utils/auth')
const{updateProfileValdtion,checkPhoto,checkIsBlock} = require('../utils/checkData')


const {createError} = require('../utils/createError')




exports.getProfile = async(req,res,next) => {
    try{
        const{username} = req.params;
        
        if (!username)
        {
               throw createError("البينات ليست كامله",400)
           
        }
        let user = await User.findOne({where:{username}});
        if (!user)
        {
                throw createError("هذا المستخدم غير موجود او تم حذف حسابه",400)
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
            await checkIsBlock(reqUserInstance,user,next)
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
       next(err)
    }
}



exports.addUserData = async(req,res,next) => {
    try{
        let user =   await  isUser(req.user,next)
  
        let {username,email,password} = req.body;
       
       let dataAfterChecks =  await updateProfileValdtion(user,username,email,password);
        await valdtionDataUpdate(username,email,user,next);
        let data = checkUserData(dataAfterChecks,next)
        
    if (req.file)
    {   
        checkPhoto(req.file,next)   
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
        next(err)
    }
}






exports.requestsFriend = async(userData,friend,next) => {
        let user =   await  isUser(userData,next)
        await checkIsBlock(userData,friend,next)
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
                 throw createError("لأ يمكنك ارسال طلبين",400)
            }       
   
         let friendProfile = await Profile.findOne({where:{userId:friend.id}});        
         let userProfile = await Profile.findOne({where:{userId:user.id}});        
               
        await friendProfile.increment('followers', { by: 1 });
        await userProfile.increment('UserFollows', { by: 1 });
            
      
  
        await user.createSentRequest({friendId:friend.id})
   
}









exports.reject = async(req,res) => {
    try{
        let user = await isUser(req.user,next)
        const{username,service} = req.body;
        let friend = await User.findOne({where:{username}});
       
        if (!friend)
        {
            throw createError("هذا الشخص غير موجود",404)
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
              throw createError("هذا الطلب غير موجود",404)
        }
        await friendRequest.destroy();
        res.status(201).json();
    }catch(err)
    {
      next(err)
    }
}



exports.acceptRequest = async(req,res,next) => {
    try{
        let user = await isUser(req.user,next)
        const{username} = req.body;
       
        let friend = await User.findOne({where:{username}});    
   
        if (!friend)
        {
            throw createError("هذا الشخص غير موجود",404)
        }
        let friendRequest = await requestFriend.findOne({where:{userId:friend.id,friendId:user.id}});
        
        if (!friendRequest )
        {
            throw createError("هذا الطلب غير موجود",404)
        }
        else if (friendRequest.friendId != user.id)
        {
            throw createError("لأ يمكنك قبول طلب انت ارسلته",400)
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
       next(err)
    }
}









exports.cancelFriend = async(req,res,next) => {
    try{
        let user = await isUser(req.user,next)
        let {username} = req.body;
        let friend = await User.findOne({where:{username}});
        if (!friend)
        {
           throw createError("هذا الشخص غير موجود",400)
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
            throw createError("انتم لستم اصدقاء بلفعل",400)
        }
        await isFriend.destroy();
        res.status(201).json({});
    }catch(err)
    {
        next(err)
    }
}














exports.blockUser = async(req,res,next) =>{
    try{
        let user = await isUser(req.user,next)
        const {username} = req.params;
        if (username === user.username)
        {
            throw createError("لأ يمكنك حظر نفسك",400)
        }
        let friend = await User.findOne({where:{username}})
        if (!friend)
        {
             throw createError("هذا الشخص غير موجود",400)
        }
              let block = await blocks.findOne({where:{
                [Op.or]:[
                    {recivceBlock:user.id,sentBlock:friend.id},
                    {recivceBlock:friend.id,sentBlock:user.id}

                ]
            }})
        if (block)
        {
            throw createError("هذا الشخص محظور بلفعل",400)

        }
        let statusUser =  await userRelations(user,friend,next)
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
        next(err)
    }
}

exports.cancelBlock = async(req,res,next) => {
    try{
        let user = await isUser(req.user,next)
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
            throw createError("انت لم تقم بحظره بلفعل",400)
        }
      
        await block.destroy();
        res.status(201).json();
    }catch(err)
    {
        next(err)
    }
}








exports.getBlocks = async(req,res,next) => {
    try{
         let user = await isUser(req.user,next)
         let blocks = await user.getSentBlock();
         let usersBlocksIds = blocks.map(blockUser => blockUser.recivceBlock)
         let usersBlocks = await User.findAll({where:{id:usersBlocksIds},attributes:["id","username","photo"]})
         res.status(200).json({usersBlocks})
    }catch(err)
    {
        next(err)
    }
}

exports.removeBlock = async(req,res,next) => {
    try{
         let user = await isUser(req.user,next)
         if (!req.body.idBlock)
         {
             throw createError("البينات ليست كامله",400)
         }
         const{idBlock} = req.body;
         let blocks = await user.getSentBlock({where:{recivceBlock:idBlock}})
         if (blocks.length < 1)
         {
           throw createError("هذا الشخص غير موجود",400)
         }
         await blocks[0].destroy()
         res.status(201).json()
    }catch(err)
    {
      next(err)
    }
}








