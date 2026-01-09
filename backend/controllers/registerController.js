
const {User,Profile} = require('../models/Relationships');
const {checkUserData,hashPassword,valdtionData} = require('../utils/auth')



const {createError} = require('../utils/createError')


exports.register = async(req,res,next) => {
    try {
        let {username,email,password} = req.body;
 
        checkUserData({username,email,password,next})
        let hashPass = await hashPassword(password);
        await valdtionData(username,email,next);
        let newUser = await User.create({password:hashPass,username,email})
        let newProfile = await newUser.createProfile();
    
        res.status(201).json({message:"تم انشاء الحساب بنجاح"})
    }catch (err)
    {

        next(err)
    }
}

