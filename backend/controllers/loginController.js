const {User} = require('../models/userModel');



const {checkUserData,comparePassword,createToken} = require('../utils/auth')












exports.login = async(req,res,next) => {
    try {
        const{email,password} = req.body;
        let username = "OtakuHub"
        checkUserData({username,email,password});
        let user = await  User.findOne({where:{email}});
        if (!user)
        {
            throw new Error("هذا المستخدم غير موجود")
        }
     
        await comparePassword(password,user.password)
        let token =  createToken(user.username,user.id);
        return res.status(200).json({
            message:"تم تسجيل الدخول بنجاح",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                photo:user.photo
            }
        })
    }catch(err)
    {
        return res.status(400).json({message:err.message})
    }
}


