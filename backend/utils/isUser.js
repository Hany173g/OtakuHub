const {User} = require('../models/userModel')










const{createError} = require('./createError')







const isUser = async(userData) => {
   
        
        if (!userData || !userData.id)
        {
      
           throw createError("يجب تسجيل الدخول أولاً",401)
        }
    
        let user = await User.findByPk(userData.id);
        if (!user)
        {
          throw createError("هذا المستخدم غير موجود",401)
        }
        
   
        return user;
}








module.exports = {isUser};