const {User} = require('../models/userModel')


const validator = require('validator')

const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')

 const crypto = require('crypto');

require('dotenv').config()



// check all user data and lengths and throw error

let checkUserData = ({username,email,password}) => 
{
   
    if (!username || !email || !password )
    {
        throw new Error("البينات ليست كامله")
    }
    if (!validator.isEmail(email))
    {
        throw new Error("هذا ليس ايميل")
    }
    if (username.length < 5|| username.length > 15 )
    {
        throw new Error(" يجيب ان يكون الأسم اكبر من 4 حرف و اصغر من 16 حرف")
    }
  
    return {username,email,password}
}



let valdtionData = async(username = null,email = null,user) => 
{
    

    let [checkEmail,checkUsername] = await Promise.all([
         User.findOne({where:{email}}),
         User.findOne({where:{username}})
    ])

    if (checkEmail)
    {
      
     
             throw new Error("هذا الأيميل مستخدم من قبل")
        
       
    }
    
    else if (checkUsername )
    {   
             throw new Error("هذا الأسم مستخدم من قبل")
       
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
          throw new Error("هذا الأيميل مستخدم من قبل")
      }          
    }
    
     if (checkUsername )
    {   
        if (checkUsername.id != user.id)
        {
            throw new Error("هذا الأسم مستخدم من قبل")
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
        throw new Error("هذا التوكن غير صالح")
     if(!newPassword)
        throw new Error("من فضلك قم بكتابه الرمز الجديد")
}


let comparePassword = async(password,userPassword) => {
    let hashPassword = await bcrypt.compare(password,userPassword);
    if (!hashPassword)
    {
       throw new Error ("هذا الباسورد غير صحيح");
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