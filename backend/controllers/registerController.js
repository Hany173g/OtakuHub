
const {User,Profile} = require('../models/Relationships');
const {checkUserData,hashPassword,valdtionData} = require('../utils/auth')





exports.register = async(req,res) => {
    try {
        let {username,email,password} = req.body;
 
        checkUserData({username,email,password})
        let hashPass = await hashPassword(password);
        await valdtionData(username,email);
        let newUser = await User.create({password:hashPass,username,email})
        let newProfile = await newUser.createProfile();
    
        res.status(201).json({message:"تم انشاء الحساب بنجاح"})
    }catch (err)
    {
        res.status(400).json({message:err.message})
    }
}