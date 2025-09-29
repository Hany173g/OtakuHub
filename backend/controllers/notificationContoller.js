const {User,requestFriend} = require('../models/Relationships');

const {isUser} =require('../utils/isUser')









exports.getFriendsRequest = async(req,res) => {
    try{
        let user =   await  isUser(req.user)
        let receivedRequest = await user.getReceivedRequests();
        let userIds = receivedRequest.map(receiveRequest => receiveRequest.userId);
        let users = await User.findAll({where:{id:userIds},attributes:['username','photo']});
        let allUsersReceived =users;
  
        res.status(200).json({allUsersReceived})
    }catch(err)
    {
        res.status(400).json({message:err.message})
    }
}