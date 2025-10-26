const {User} = require('../models/userModel')










const{createError} = require('./createError')







const isUser = async(userData) => {
        console.log('🔍 isUser check - userData:', !!userData, 'id:', userData?.id)
        
        if (!userData || !userData.id)
        {
           console.log('❌ No user data or ID, throwing 401')
           throw createError("يجب تسجيل الدخول أولاً",401)
        }
    
        let user = await User.findByPk(userData.id);
        if (!user)
        {
          console.log('❌ User not found in database, throwing 401')
          throw createError("هذا المستخدم غير موجود",401)
        }
        
        console.log('✅ User found:', user.id)
        return user;
}








module.exports = {isUser};