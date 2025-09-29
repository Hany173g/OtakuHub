const { Op } = require('sequelize');
const {User,requestFriend,friends} = require('../models/Relationships');





const userRelations = async(user, friend) => {
    try {

        let request = await requestFriend.findOne({
        where: {
            [Op.or]: [
            { userId: user.id, friendId: friend.id },   
            { userId: friend.id, friendId: user.id }     
            ]
        }
        });
        
 
           let isFriends  = await friends.findOne({where:{
                 [Op.or]: [
                { userId: user.id, friendId: friend.id },   
                { userId: friend.id, friendId: user.id }
            ]}})
      
        let isRequestSent = false;
      
        let isReceivedRequest = false;
        if(request)
            {
               isReceivedRequest = request && request.friendId === user.id;
                 isRequestSent = request && request.userId === user.id;
            } 

        
        let isFriend = false;
        if (isFriends)
        {
            isFriend = isFriends.friendId == user.id || isFriends.userId === user.id;
        }
       
  
        return { isRequestSent,isReceivedRequest ,isFriend};
    } catch (err) {
        throw new Error(err.message);
    }
}



module.exports = {userRelations}