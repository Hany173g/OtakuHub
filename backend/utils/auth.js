const {User} = require('../models/userModel')


const validator = require('validator')

const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')

 const crypto = require('crypto');

require('dotenv').config()



// check all user data and lengths and throw error

let checkUserData = ({username,email,password,next}) => 
{
   
    if (!username || !email || !password )
    {
       
        return next(createError("البينات ليست كامله",400))
    }
    if (!validator.isEmail(email))
    {
         return next(createError("هذا ليس ايميل",400))
    }
    if (username.length < 5|| username.length > 15 )
    {
        return next(createError("يجيب ان يكون الأسم اكبر من 4 حرف و اصغر من 16 حرف",400))     
    }
  
    return {username,email,password}
}



let valdtionData = async(username = null,email = null,user,next) => 
{
    

    let [checkEmail,checkUsername] = await Promise.all([
         User.findOne({where:{email}}),
         User.findOne({where:{username}})
    ])

    if (checkEmail)
    {
     
           return  next(createError("هذا الأيميل مستخدم من قبل",401))
          
        
    }
    
    else if (checkUsername )
    {   
            return next(createError("هذا الأسم مستخدم من قبل",401))
    }
   
}



let valdtionDataUpdate = async(username = null,email = null,user) => 
{
    

    let [checkEmail,checkUsername] = await Promise.all([
         User.findOne({where:{email}}),
         User.findOne({where:{username}})
    ])

    if (checkEmail)
    {
      if (checkEmail.id != user.id)
      {
         return  next(createError("هذا الأيميل مستخدم من قبل",400))
      }          
    }
    
     if (checkUsername )
    {   
        if (checkUsername.id != user.id)
        {
             return  next(createError("هذا الأسم مستخدم من قبل",400))
        }
    }
 
   
}



let hashPassword = async(password) => {

    let hash = await bcrypt.hash(password,12);
    
    return hash;
}








let checkResetData = (newPassword,token) => 
{
       if(!token.includes('_')) 
        return  next(createError("هذا التوكن غير صالح",400))

     if(!newPassword)
        return  next(createError("من فضلك قم بكتابه الرمز الجديد",400))
}


let comparePassword = async(password,userPassword,next) => {
    let hashPassword = await bcrypt.compare(password,userPassword);
    if (!hashPassword)
    {
        return  next(createError("هذا الباسورد غير صحيح",401))
    }
     
}



let createToken = (name,id) => {
    let token = jwt.sign({name,id},process.env.JWT_SECERT,{expiresIn:'5d'});
    return token
}



let randomToken = () => {
   

        function generateRandomToken(length = 20) {
        return crypto.randomBytes(length).toString('hex'); // طول الكود: 40 حرف
        }

        return generateRandomToken()

}



module.exports  = {checkUserData,hashPassword,valdtionDataUpdate,valdtionData,comparePassword,createToken,randomToken,checkResetData} 