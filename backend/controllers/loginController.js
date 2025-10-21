const {User} = require('../models/userModel');



const {createError} = require('../utils/createError')


const {checkUserData,comparePassword,createAcessToken,createRefreshToken} = require('../utils/auth')

const jwt = require('jsonwebtoken')



const {isUser} = require('../utils/isUser')






exports.login = async(req,res,next) => {
    try {
        const{email,password} = req.body;
        let username = "OtakuHub"
        checkUserData({username,email,password,next});
        let user = await  User.findOne({where:{email}});
        if (!user)
        {
          throw createError("هذا المستخدم غير موجود",401)
        }
     
        await comparePassword(password,user.password,next)
        let token =  createAcessToken(user.username,user.id);
        let refreshToken = createRefreshToken(user.username,user.id)
  
        res.cookie('refreshToken',refreshToken, {
            httpOnly:true,
            secure:false,
            sameSite:'lax', // Changed from 'strict' to 'lax' for better compatibility
            maxAge: 15 * 24 * 60 * 60 * 1000
        })
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






exports.refreshToken = async(req,res,next) => {
    try{
         const token = req.cookies.refreshToken;
      
         if (!token) throw createError("لا يوجد refresh token",401)
         
         let decode = jwt.verify(token,process.env.JWT_SECERT_REFRESH_TOKEN)
        
         
        if (!decode)
        {
            throw createError("التوكن غير صالح",401)
        }
        let acessToken =  createAcessToken(decode.name,decode.id);

        res.status(200).json({acessToken})
    }catch(err)
    {
        next(err)
    }
}





exports.logout = async(req,res,next) => {
    try{
        let user = await isUser(req.user);
         res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    });
    res.status(201).json()
    }catch(err)
    {
        next(err)
    }
}