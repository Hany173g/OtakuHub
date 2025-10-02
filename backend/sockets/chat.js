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
            
            // Send to friend with notification data
            io.to(friend.id).emit('messageSend', {
                content: content,
                fromUsername: user.username,
                fromUserId: user.id,
                photo: user.photo,
                timestamp: new Date().toISOString()
            })
            
            // Send confirmation to sender
            socket.emit('messageConfirmed', {
                content: content,
                toUsername: friendUsername,
                fromUsername: user.username,
                fromPhoto: user.photo,
                timestamp: new Date().toISOString(),
                photo: friend.photo
            })
        })
        socket.on('deleteMessage' , async(token,messageId) => {
             try{
                 let data =  verifyToken(token)
                 let result = await message.deleteMessage(data,messageId)
                 socket.emit("messageDelete", result)
             }catch(err)
             {
                 socket.emit('error', { message: err.message });
             }
        })
    }catch(err)
    {
        throw new Error(err.message)
    }
}