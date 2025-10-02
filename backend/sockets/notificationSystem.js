
const {checkFriendRequestData} = require('../utils/checkData')
const {User} = require('../models/userModel')
const verifyToken = require('../utils/verifyToken')



module.exports = (io) => {
    io.on('connection', socket => {
        try {
            
            socket.on('joinNotificationRoom', ( token) => {
                try{
                    let user = verifyToken(token);
                    
                        socket.join(user.id);
                        socket.emit('goOnline', { success: true });
                    
                }  catch(err)
                {
                    socket.emit('goOnline',{success:false})
                }
            });
            
        } catch (err) {
         
            throw new Error(err.message)
        }
    });
};




