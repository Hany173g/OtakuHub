const {privateMessage,User,friends}  =require('../models/Relationships')
const {isUser} =require('../utils/isUser')

const{checkDataMessage,checkIsBlock} = require('../utils/checkData')

const {Op, where, Error} = require('sequelize')


const {createError} = require('../utils/createError')





const _ = require("lodash");


exports.sendMessage = async(username,content,user) => {
    try{
     
       let friend = await checkDataMessage(username,content,user);
        if (user.id === friend.id)
        {
         throw createError("لأ يمكنك الأرسال لنفسك",400)
        }
        await checkIsBlock(user,friend)
       await user.createSentMessage({receiveId:friend.id,content})
       return friend;
    }catch(err)
    {
       next(err)
    }
}



exports.getChat = async(req,res) => {
    try{
        let user = await isUser(req.user);
        const{username} = req.body;
        
        if (!username || username.trim() === '') {
          throw createError("اسم المستخدم مطلوب",400)
        }
        
        let friend = await User.findOne({where:{username}})
        if (!friend)
        {
            throw createError("هذا الشخص غير موجوده",400)
        }
        
   
       
        let sent = await user.getSentMessage({where:{receiveId:friend.id}, order: [['createdAt', 'ASC']]});
       
        let received = await friend.getSentMessage({where:{receiveId:user.id}, order: [['createdAt', 'ASC']]});


        /// code with chatgpt
        let messages = [
            ...sent.map(msg => ({...msg.toJSON(),isOwner:true})),
            ...received.map(msg => ({...msg.toJSON(),isOwner:false}))
        ]

        await privateMessage.update(
        { isRead: true },
        {
            where: {
            senderId: friend.id,
            receiveId: user.id,
            isRead: false
            }
        }
        );
        let allChat = _.sortBy(messages, "createdAt");
        
        res.status(200).json({allChat})
    }catch(err)
    {
        next(err)
    }
}





exports.deleteMessage = async(data,messageId) => {
    try{
        let user = await isUser(data);
        let message = await privateMessage.findOne({where:{id:messageId}});
        if (!message)
        {
          throw createError("هذا الرساله غير موجوده",400)
        }
        if (message.senderId != user.id)
        {
         throw createError("لأ يمكن حذف رساله ليست لك",400)
        }
        await message.update({content:"هذا الرساله تم حذفها",})
    
    }catch(err)
    {
        next(err)
    }
}




