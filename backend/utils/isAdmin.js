const {User} = require('../models/userModel')










const{createError} = require('./createError')




let Permissions = ["Admin","Supporter"]


const isAdmin = async(userData) => {
        if (!userData)
        {
           throw createError("يحب تسجيل الدخول",401)
        }
    
        let user = await User.findByPk(userData.id);
        if (!user)
        {
          throw createError("هذا المستخدم غير موجود",401)
        }
        else if(!Permissions.includes(user.role))
        {
            throw createError("تم رفض الطلب - صلاحيات غير كافية",403)
        }
        return user;
}






module.exports = {isAdmin};