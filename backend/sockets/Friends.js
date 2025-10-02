

const verifyToken = require('../utils/verifyToken')


const {isUser} =require('../utils/isUser')

const friendsContoller = require('../controllers/friendsContoller')
module.exports = (io,socket) => {
  
        socket.on('onlineUser',async(token) => {
            try{
          
                let data = verifyToken(token)
              
                let user = await isUser(data); 
                
                
                
                io.OnlineUsers[user.id] = socket.id
          
                socket.userId = user.id;           
            }catch(err)
            {
                console.log('❌ Error in onlineUser:', err.message)
                socket.emit('error', { message: err.message });
            }
    
    })

   
    
    
    socket.on('disconnect',() => {
        delete io.OnlineUsers[socket.userId];
 
    })

    socket.on('getFriends',async(token) => {
        try{
            let data =  verifyToken(token)
            let user = await isUser(data); 
            let onlineFriends = io.OnlineUsers

            let friends =  await friendsContoller.getFriends(user,onlineFriends)
     
            socket.emit('sendFriends', friends)
        }catch(err)
        {
           console.log(err.message);
            socket.emit('error', { message: err.message });
        }
        
    })
}

