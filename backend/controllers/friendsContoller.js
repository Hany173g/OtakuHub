const {Profile,friends,User,Blogs,commentStats,commentsBlogs,requestFriend} = require('../models/Relationships');


const {Op, where} = require('sequelize')













exports.getFriends = async(user,onlineFriends) => {
    try{
         let userFriends = await friends.findAll({
                        where: {
                            [Op.or]: [
                            { userId: user.id },   
                            { friendId: user.id }     
                            ]
                        }
                });
            
        let usersIds = userFriends.map(_user =>
        {
            if(_user.userId != user.id)
            {
                return _user.userId;
            }
            else
            {
                return _user.friendId;
            }
        }
        )
        let users = await User.findAll({where:{id:usersIds},raw:true});
 
        const keys = Object.keys(onlineFriends);
  
        users.forEach(user => {
            user.isOnline = keys.some(key => key == user.id)
        });
        let isOnline = [];
        let isOffline =[];
         users.map(user => {
            if (user.isOnline)
            {
                isOnline.push(user)
            }
            else
            {
                isOffline.push(user)
            }
        })
       
        const sortedFriends = [...isOnline, ...isOffline];
        return sortedFriends;
    }catch(err)
    {
        throw new Error(err.message)
    }
}





