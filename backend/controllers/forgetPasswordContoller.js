const {User} = require('../models/userModel');
const {resetToken} = require('../models/resetToken');


const {createError} = require('../utils/createError')


const {randomToken,hashPassword,checkResetData} = require('../utils/auth');


const {sentEmail} = require('../utils/sentEmail')








exports.forgetPassword = async(req,res,next) => {
    try{
        const{email} = req.body;
        let user = await User.findOne({where:{email}});
        if (!user)
        {
           throw createError("هذا المستخدم غير موجود",400)
        }
        let token = randomToken() + '_'+user.id.toString();;
        await resetToken.create({token,expiredToken:Date.now()})
        sentEmail(token,email)
        res.status(200).json({message:"من فضلك قم بتفحص الأميل الخاص بك"})
    }catch(err)
    {
         next(err)
    }
}


// exports.checkExpired = async(req,res) => {
//     try{
//         const {token} = req.params;
//         let checkToken = await resetToken.findOne({where:{token}});
        
//         let now = Date.now();
//         let hour = 1000 * 60 *60;
//         if (!checkToken)
//         {
//             throw new Error("هذا الكود غير صحيح او انتهاء مده المسموح به")
//         }
//         else if (now > checkToken.expiredToken  + hour )
//         {
//              throw new Error("هذا الكود غير صحيح او انتهاء مده المسموح به")
//         }
//         res.status(200).json()
//     }catch(err)
//     {
//         res.status(400).json({message:err.message})
//     }
// }


exports.resetPassword = async(req,res,next) => {
    try{
        const {newPassword,token} = req.body;
        let checkToken = await resetToken.findOne({where:{token}});
        
        let now = Date.now();
        let hour = 1000 * 60 *60;
        if (!checkToken)
        {
         throw createError("هذا الكود غير صحيح او انتهاء مده المسموح به",400)
         
        }
        else if (now > checkToken.expiredToken  + hour )
        {
             throw createError("هذا الكود غير صحيح او انتهاء مده المسموح به",400)
        }
        checkResetData(newPassword,token,next)
        let parts = token.split('_');
        let id = parts[1]; 
        let password = await hashPassword(newPassword);
        await User.update(
            { password }, 
            { where: { id } }          
            );   
        res.status(201).json({message:"تم تحديث الرمز بنجاح"})
    }catch(err)
    {
       next(err)
    }
}


