const { where ,Op} = require('sequelize');
const {User,requestFriend,Notification} = require('../models/Relationships');

const {readBroadcastNotifcation} = require('../models/readBroadCastNotifcationModel')
const {broadCastNotifcation} = require('../models/broadcastNotificationModel')


const {isUser} =require('../utils/isUser')









exports.getFriendsRequest = async(req,res,next) => {
    try{
        let user =   await  isUser(req.user)
        let receivedRequest = await user.getReceivedRequests();
        let userIds = receivedRequest.map(receiveRequest => receiveRequest.userId);
        let users = await User.findAll({where:{id:userIds},attributes:['username','photo']});
        let allUsersReceived =users;
  
        res.status(200).json({allUsersReceived})
    }catch(err)
    {
      next(err)
    }
}






exports.getNotication = async(req,res,next) => {
    try{
        let user =   await  isUser(req.user)
        let userNottication = await Notification.findAll({where:{userId:user.id,isRead:false},order:[['createdAt','DESC']],limit:20})
      
     
        res.status(200).json({userNottication})
    }catch(err)
    {
       next(err)
    }
}


exports.markNotfcsRead = async(req,res,next) => {
    try{
        const {ids} = req.body;
        
       await Notification.update(
        { isRead: true },
        { where: { id: ids } }
        );
        res.status(201).json()
    }catch(err)
    {
        next(err)
    }
}



exports.getBroadCastNotfcs = async(req,res,next) => {
    try{
          let user = await isUser(req.user)
          let readNotfsc = await readBroadcastNotifcation.findAll({where:{userId:user.id}})
          let readNotfscIds = readNotfsc.map(notfcs => {
            return notfcs.notfcsId  
          })     
          let broadNotfsc = await broadCastNotifcation.findAll({
            where:{
                id:{
                    [Op.notIn]: readNotfscIds
                }
            },
            limit:20,
            order:[['createdAt','DESC']]
          })
          res.status(200).json({broadNotfsc})
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}








exports.markBroadCastNotfcsRead =  async(req,res,next) => {
    try{
         const {ids} = req.body;
        await readBroadcastNotifcation.bulkCreate(
        ids.map(id => ({
            userId: req.user.id,
            notfcsId:id,
        })),
        { ignoreDuplicates: true }
        );
          res.status(201).json()
    }catch(err)
    {
        next(err)
    }
}