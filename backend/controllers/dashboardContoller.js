const{User,bannedUser,SecuirtyLogs} = require('../models/Relationships')


const {isUser} =require('../utils/isUser')

const {comparePassword} = require('../utils/auth')
const {updateProfileValdtion,getFavorite} = require('../utils/checkData')

const jwt = require("jsonwebtoken")


const {createError} = require('../utils/createError')
const {checkUserData} = require('../utils/auth')

const {createAcessToken,deletUser,createRefreshToken,getProfiledata,updateProfileData,checkRole,checkUser,checkUpdateData,checkHomeData,lastUsers,getUserData,getAllSeenUser,analyticsVistors,blogsNumbers,usersNumbers,getVistors} = require('../utils/dashboardUtils')
const {createBlog} = require('../service/blogService')

const {broadCastNotifcation} = require('../models/broadcastNotificationModel')



const {isAdmin} = require('../utils/isAdmin')
const { Op } = require('sequelize')




exports.login = async(req,res,next) => {
    try{
         const{email,password} = req.body;
                let username = "OtakuHub"
                    console.log(username)
    
                checkUserData({username,email,password,next});
                let user = await  User.findOne({where:{email}});
                if (!user)
                {
                  throw createError("هذا المستخدم غير موجود",401)
                }        
                await comparePassword(password,user.password,next)
                if (user.role != "Admin")
                {
                    throw createError("الرمز غير صحيح",400)
                }
                let token =  createAcessToken(user.username,user.id);
                let refreshToken = createRefreshToken(user.username,user.id)
          
                res.cookie('refreshToken',refreshToken, {
                    httpOnly:true,
                    secure:false,
                    sameSite:'lax', 
                    maxAge: 7 * 24 * 60 * 60 * 1000
                })
        res.status(200).json({token})
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}





exports.refreshToken = async(req,res,next) => {
    try{
         const token = req.cookies.refreshToken;
      
         if (!token) throw createError("لا يوجد refresh token",401)
         
         let decode = jwt.verify(token,process.env.JWT_SECERT_REFRESH_TOKEN_DASHBOARD)
        
         
        if (!decode)
        {
            throw createError("التوكن غير صالح",401)
        }
        let acessToken = createAcessToken(decode.name, decode.id);

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










exports.getHome = async(req,res,next) => {
    try{
        let Admin = await isAdmin(req.user);
        let {blogDay,userDay,vistorDay,analtyicsDay} = req.body;
        blogDay = blogDay || 0;
        userDay = userDay || 0;
        vistorDay = vistorDay || 0;
        analtyicsDay = analtyicsDay || 1;
        checkHomeData(blogDay,userDay,vistorDay,analtyicsDay)
        let {toDayBlogsNumbers,allBlogsNumbers} = await blogsNumbers(blogDay)
        let {todayUsersNumbers,allUsersNumbers} = await usersNumbers(userDay)
        let analtyics = await analyticsVistors(analtyicsDay);
        let {allVisitorsNumbers,todayVisitorsNumbers} = await getVistors(vistorDay)
        let lastsUsers = await lastUsers();
        
        res.status(200).json({toDayBlogsNumbers,allBlogsNumbers,todayUsersNumbers,allUsersNumbers,allVisitorsNumbers,todayVisitorsNumbers,analtyics,lastsUsers}) 
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}






exports.getUser = async(req,res,next) => {
    try{
         let Admin = await isAdmin(req.user);
        const{username } = req.body;
        let user = await getUserData(username);
        res.status(200).json({user})
    }catch(err)
    {
        next(err)
    }
}







exports.getUserSeen = async(req,res,next) => {
    try{
        let Admin = await isAdmin(req.user);
        const{username } = req.body;
        let lastSeens = await getAllSeenUser(username)
        res.status(200).json({lastSeens})
    }catch(err)
    {
        next(err)
    }
}




exports.banUser = async(req,res,next) => {
    try{
        let Admin = await isAdmin(req.user);
        const{username,days } = req.body;
        let user = await checkUser(username);
        await checkRole(user,Admin.id)
        if (typeof days != "number" || days < 0)
        {
            throw createError("البينات ليست صحيحه",400)
        }

        let milisecondDays = days * 24 * 60 * 60 * 1000 + Date.now()
        let  newBan =     await bannedUser.create({userId:user.id,timeBanned:milisecondDays})
        console.log(newBan)
        res.status(201).json()
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}






exports.removeBan = async(req,res,next) => {
    try{
        let Admin = await isAdmin(req.user);
        const {username} = req.body;
        let user = await checkUser(username);
        
        let checkIsban = await bannedUser.findOne({where:{userId:user.id,groupId:null}})
        if (!checkIsban)
        {
            throw createError("هذا المستخدم غير محظور",400)
        }
        await checkIsban.destroy();
        res.status(201).json()
    }catch(err)
    {
        next(err)
    }
}












exports.updateUserData = async(req,res,next) => {
    try{
        let Admin = await isAdmin(req.user);
        const {username,password,email,id} = req.body;
        let userUpdate = await checkUpdateData(username,email,password,id,req.file)
        
        res.status(201).json({userUpdate})
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
} 






exports.deletUser = async(req,res,next) => {
    try{
        let Admin = await isAdmin(req.user);
        const {id} = req.body;
        await deletUser(id,Admin.id);
        res.status(201).json()
    }catch(err)
    {
        next(err)
    }
}




exports.getProfileUser = async(req,res,next)=> {
    try{
           let Admin = await isAdmin(req.user);
           const {id} = req.body;
           let user = await User.findByPk(id)
           if (!user)
           {
            throw createError("البينات ليست كامله")
           }
           let profileData = await user.getProfile();
           res.status(200).json({profileData})
    }catch(err)
    {
           console.log(err.message)
        next(err)
    }
}


exports.updateProfileStatus = async(req,res,next) => {
    try{
        let Admin = await isAdmin(req.user);
        const {id,followers,UserFollows,likes} = req.body;
        let userProfile = await updateProfileData(id,followers,UserFollows,likes)
        res.status(201).json({userProfile})
    }catch(err)
    {
        next(err)
    }
}

exports.updateUserData = async(req,res,next) => {
    try{
        let Admin = await isAdmin(req.user);
        const {username,password,email,id} = req.body;
        let userUpdate = await checkUpdateData(username,email,password,id,req.file)
        
        res.status(201).json({userUpdate})
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}

exports.verifyUser = async(req,res,next) => {
    try{
         let Admin = await isAdmin(req.user);
         const {username} = req.body;
     
         let user = await checkUser(username)
         if (user.verified)
         {
            throw createError("هذا الشخص موثق بالفعل",400)
         }

        await user.update({verified:true})
        res.status(201).json({message: "تم توثيق المستخدم بنجاح"})
    }catch(err)
    {
        next(err)
    }
}

exports.removeVerifyUser = async(req,res,next) => {
    try{
        let Admin = await isAdmin(req.user);
         const {username} = req.body;
         let user = await checkUser(username)
         if (!user.verified)
         {
            throw createError("هذا الشخص ليس موثق",400)
         }
        await user.update({verified:false})
        res.status(201).json({message: "تم إلغاء توثيق المستخدم بنجاح"})
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}










exports.getFavUser = async(req,res,next) => {
    try{
        let Admin = await isAdmin(req.user);
         const {username} = req.body;
         let user = await checkUser(username)
        let fav = await getFavorite(user)
        res.status(200).json({fav})
    }catch(err)
    {
        next(err)
    }
}










exports.getUserBlocks = async(req,res,next) => {
    try{
        let Admin = await isAdmin(req.user);
         const {username} = req.body;
         let user = await checkUser(username)
         let blocks = await user.getSentBlock();
         let usersBlocksIds = blocks.map(blockUser => blockUser.recivceBlock)
         let usersBlocks = await User.findAll({where:{id:usersBlocksIds},attributes:["id","username","photo","verified"]})
         res.status(200).json({usersBlocks})
    }catch(err){
        next(err)
    }
}


exports.createBlog = async(req,res,next) => {
    try {
    let Admin = await isAdmin(req.user);
    const {username} = req.body;
    let user = await checkUser(username)
   let {newBlog} =  await createBlog(req.body,req.file,user)
    res.status(201).json({blogData:newBlog})
    }catch(err)
    { 
        console.log(err.message)
       next(err)
    }
}










exports.userSecuirtyLogs = async(req,res,next) => {
    try{
    let Admin = await isAdmin(req.user);
    const {username} = req.body;
    let user = await checkUser(username)
    let logs = await user.getSecuirtyLogs({limit:5})
    res.status(200).json({logs})
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}







exports.sendMessageToAllUsers = async(req,res,next) => {
    try{
        let Admin = await isAdmin(req.user);
        const {type,content} = req.body;
        if (!type || !content)
        {
            throw createError("البينات ليست كامله",400)
        }
        if (!["warring","info","update"].includes(type))
        {
            throw createError("البينات غير صحيحه",400)
        }
        await broadCastNotifcation.create({content,type})
        res.status(201).json()
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}



