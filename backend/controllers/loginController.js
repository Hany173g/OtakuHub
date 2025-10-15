const {User} = require('../models/userModel');



const {createError} = require('../utils/createError')


const {checkUserData,comparePassword,createToken} = require('../utils/auth')












exports.login = async(req,res,next) => {
    try {
        const{email,password} = req.body;
        let username = "OtakuHub"
        checkUserData({username,email,password,next});
        let user = await  User.findOne({where:{email}});
        if (!user)
        {
            return next(createError("هذا المستخدم غير موجود",401))
        }
     
        await comparePassword(password,user.password,next)
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
       next(err)
    }
}


