const {User} = require('../models/userModel')














const isUser = async(userData) => {
        if (!userData)
        {
            throw new Error("يحب تسجيل الدخول")
        }
    
        let user = await User.findByPk(userData.id);
        if (!user)
        {
            throw new Error("هذا المستخدم غير موجود")
        }
        return user;
}








module.exports = {isUser};