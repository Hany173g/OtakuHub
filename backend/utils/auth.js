const {User} = require('../models/userModel')


const validator = require('validator')

const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')

 const crypto = require('crypto');

require('dotenv').config()




const{createError} = require('./createError')



// check all user data and lengths and throw error

let checkUserData = ({username,email,password,next}) => 
{
   
    if (!username || !email || !password )
    {
       
      throw createError("البينات ليست كامله",400)
    }
    if (!validator.isEmail(email))
    {
        throw createError("هذا ليس ايميل",400)
    }
    if (username.length < 5|| username.length > 15 )
    {
         throw createError("يجيب ان يكون الأسم اكبر من 4 حرف و اصغر من 16 حرف",400)
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
         throw createError("هذا الأيميل مستخدم من قبل",401)
    }
    
    else if (checkUsername )
    {   
       throw createError("هذا الأسم مستخدم من قبل",401)
    }
   
}



let valdtionDataUpdate = async(username = null,email = null,user,next) => 
{
    

    let [checkEmail,checkUsername] = await Promise.all([
         User.findOne({where:{email}}),
         User.findOne({where:{username}})
    ])

    if (checkEmail)
    {
      if (checkEmail.id != user.id)
      {
          throw createError("هذا الأيميل مستخدم من قبل",400)
      }          
    }
    
     if (checkUsername )
    {   
        if (checkUsername.id != user.id)
        {
             throw createError("هذا الأسم مستخدم من قبل",400)
        }
    }
 
   
}



let hashPassword = async(password) => {

    let hash = await bcrypt.hash(password,12);
    
    return hash;
}








let checkResetData = (newPassword,token,next) => 
{
       if(!token.includes('_')) 
        throw  createError("هذا التوكن غير صالح",400)

     if(!newPassword)
        throw createError("من فضلك قم بكتابه الرمز الجديد",400)
}


let comparePassword = async(password,userPassword,next) => {
    let hashPassword = await bcrypt.compare(password,userPassword);
    if (!hashPassword)
    {
          throw createError("هذا الباسورد غير صحيح",401)
    }
     
}




let randomToken = () => {
   

        function generateRandomToken(length = 20) {
        return crypto.randomBytes(length).toString('hex'); 
        }

        return generateRandomToken()

}




const createAcessToken = (name,id) => {
    let token = jwt.sign({name,id},process.env.JWT_SECERT_ACCESS_TOKEN,{expiresIn:'60m'});
    return token
}






const createRefreshToken = (name,id) => {
    let token = jwt.sign({name,id},process.env.JWT_SECERT_REFRESH_TOKEN,{expiresIn:'15d'});
    return token
}



module.exports  = {checkUserData,hashPassword,createRefreshToken,valdtionDataUpdate,valdtionData,comparePassword,createAcessToken,randomToken,checkResetData} 