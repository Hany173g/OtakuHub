const {privateMessage,User,friends}  =require('../models/Relationships')
const {isUser} =require('../utils/isUser')

const{checkDataMessage} = require('../utils/checkData')

const {Op, where, Error} = require('sequelize')





const _ = require("lodash");


exports.sendMessage = async(username,content,user) => {
    try{
     
       let friend = await checkDataMessage(username,content,user);
        if (user.id === friend.id)
        {
            throw new Error("لأ يمكنك الأرسال لنفسك")
        }
       await user.createSentMessage({receiveId:friend.id,content})
       return friend;
    }catch(err)
    {
       throw new Error(err.message)
    }
}



exports.getChat = async(req,res) => {
    try{
        let user = await isUser(req.user);
        const{username} = req.body;
        let friend = await User.findOne({where:{username}})
        if (!friend)
        {
            throw new Error("هذا الشخص غير موجود")
        }
       
        let sent = await user.getSentMessage({where:{receiveId:friend.id}, order: [['createdAt', 'ASC']]});
       
        let received = await friend.getSentMessage({where:{receiveId:user.id}, order: [['createdAt', 'ASC']]});


        /// code with chatgpt
        let messages = [
            ...sent.map(msg => ({...msg.toJSON(),isOwner:true})),
            ...received.map(msg => ({...msg.toJSON(),isOwner:false}))
        ]

        
        let allChat = _.sortBy(messages, "createdAt");
        res.status(200).json({allChat})
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}





exports.deleteMessage = async(data,messageId) => {
    try{
        let user = await isUser(data);
        let message = await privateMessage.findOne({where:{id:messageId}});
        if (!message)
        {
            throw new Error("هذا الرساله غير موجوده")
        }
        if (message.senderId != user.id)
        {
            throw new Error("لأ يمكن حذف رساله ليست لك")
        }
        await message.update({content:"هذا الرساله تم حذفها",})
    
    }catch(err)
    {
        throw new Error(err.message)
    }
}




