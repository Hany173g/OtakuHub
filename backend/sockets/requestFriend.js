const profileContoller = require('../controllers/profileContoller')
const verifyToken = require('../utils/verifyToken')
const{User} = require('../models/userModel')






module.exports = (io,socket) => {
    socket.on('sendFriendRequest' ,async(token, friendUsername) => {
        try {
            let tokenData = verifyToken(token)   
            
            // Get complete user data from database
            let user = await User.findByPk(tokenData.id, {
                attributes: ['id', 'username', 'photo']
            })
            
            if (!user) {
                throw new Error("المستخدم المرسل غير موجود")
            }
            
            let friend = await User.findOne({where: {username: friendUsername}})
            
            if (!friend) {
                throw new Error("المستخدم غير موجود")
            }
            
            await profileContoller.requestsFriend(user, friend)
            
            // Send notification directly here with complete user data
            io.to(friend.id).emit('sentNewNotification', {
                data: {
                    id: user.id,
                    username: user.username,
                    photo: user.photo
                }
            })
            
            socket.emit('requestSent', { success: true, message: "تم ارسال طلب الصداقة", friendId: friend.id})   
        }catch(err)
        {

            socket.emit('requestSent', { success: false, error: err.message})
        }
       
    })
}