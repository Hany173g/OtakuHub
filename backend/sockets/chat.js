const verifyToken = require('../utils/verifyToken')

const {isUser} =require('../utils/isUser')

const{User} = require('../models/userModel')

const message = require('../controllers/privateMessageContoller')


module.exports = (io,socket) => {
    try{
        socket.on('joinChat',async (token) => {
           let data =  verifyToken(token)
            let user = await isUser(data); 
            socket.join(user.id);
        })
        socket.on('sendMessage',async(token,friendUsername,content) => {
           let data =  verifyToken(token);
            let user = await isUser(data);
            let friend = await message.sendMessage(friendUsername,content,user)
            
            // Send to friend
            io.to(friend.id).emit('messageSend', {
                content: content,
                fromUsername: user.username,
                fromUserId: user.id,
                timestamp: new Date().toISOString()
            })
            
            // Send confirmation to sender
            socket.emit('messageConfirmed', {
                content: content,
                toUsername: friendUsername,
                timestamp: new Date().toISOString()
            })
        })
    }catch(err)
    {
        throw new Error(err.message)
    }
}