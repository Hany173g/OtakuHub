const {User} = require('../models/userModel')














const isUser = async(userData,next) => {
        if (!userData)
        {
            return next(createError("يحب تسجيل الدخول",401))
        }
    
        let user = await User.findByPk(userData.id);
        if (!user)
        {
          return  next(createError("هذا المستخدم غير موجود",401))
        }
        return user;
}








module.exports = {isUser};