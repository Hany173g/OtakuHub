const{isUser} = require('./isUser')
const { createError } = require('./createError')
const bcrypt = require('bcrypt')


const {User,Blogs,bannedUser} = require('../models/Relationships')


const{Visits} = require('../models/visitsModel')


const{lastSeen} = require('../models/lastSeenModel')



const {valdtionData,checkUserData,valdtionDataUpdate} = require('../utils/auth')
const {updateProfileValdtion} = require('./checkData')
 const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')














const createAcessToken = (name,id) => {
    let token = jwt.sign({name,id},process.env.JWT_SECERT_ACCESS_TOKEN_DASHBOARD,{expiresIn:'1h'});
    return token
}

const createRefreshToken = (name,id) => {
    let token = jwt.sign({name,id},process.env.JWT_SECERT_REFRESH_TOKEN_DASHBOARD,{expiresIn:'1d'});
    return token
}







const checkTime = (days) => {
    const now = new Date();
    if (days === 0) {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
    
        return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    }
}





const blogsNumbers = async(days = 0) => {
    let targetDate = checkTime(days)
    let filteredBlogs = await Blogs.findAll({
        where:{
            createdAt:{
                [Op.gte]: targetDate
            }
        }
    })
    let allBlogs = await Blogs.findAll({});
  
    let toDayBlogsNumbers = filteredBlogs.length; 
    let allBlogsNumbers = allBlogs.length; 
    
    return {toDayBlogsNumbers, allBlogsNumbers};
}


const usersNumbers = async(days = 0) => {
    let targetDate = checkTime(days)
    let filteredUsers = await User.findAll({
        where:{
            createdAt:{
                [Op.gte]: targetDate
            }
        }
    })
    let allUsers = await User.findAll({});
    

    let todayUsersNumbers = filteredUsers.length; 
    let allUsersNumbers = allUsers.length; 
    
    return {todayUsersNumbers, allUsersNumbers}
}





const getVistors = async(days = 0) => {
    let targetDate = checkTime(days)
    const filteredVisits = await Visits.findAll({
        where:{
            createdAt:{
                [Op.gte]: targetDate
            }
        }
    })
    let allVisits = await Visits.findAll({}); 
    
    // Return with clear naming
    let todayVisitorsNumbers = filteredVisits.length; // Number of visits in the specified period
    let allVisitorsNumbers = allVisits.length; // Total visits ever
    
    return {allVisitorsNumbers, todayVisitorsNumbers}
}




const analyticsVistors = async(days = 1) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = checkTime(days);
    
    // Today's visitors (from midnight today)
    let todayVisitors = await Visits.findAll({
        where:{
            createdAt:{
                [Op.gte]: startOfToday
            }
        }
    })
    
    // Previous period visitors (from target date to today)
    let previousVisitors = await Visits.findAll({
        where:{
            createdAt:{
                [Op.gte]: targetDate,
                [Op.lt]: startOfToday
            }
        }
    })
    
    let todayVistorNumbers = todayVisitors.length;
    let previousVisitorNumbers = previousVisitors.length;
    
    // Calculate percentage change
    if (previousVisitorNumbers === 0) {
        return todayVistorNumbers > 0 ? 100 : 0;
    }
    
    const analytics = ((todayVistorNumbers - previousVisitorNumbers) / previousVisitorNumbers) * 100;
    return Math.round(analytics * 100) / 100; 
}





const lastUsers = async() => {
    let users = await User.findAll({
        limit: 5,
        order: [["createdAt", "DESC"]],
        attributes: ["username", "id", "photo"]
    })
    return users;
}





const checkHomeData = async(blogDay,userDay,vistorDay,analayticsDay) => {
    if (typeof blogDay != "number" || typeof userDay != "number" || typeof vistorDay != "number",typeof analayticsDay != "number")
    {
        throw createError("البينات ليست صحيح",400)
    }
}



const checkUser = async(username) => {
      if (!username) throw createError("البينات ليست كامله",400)
    let user = await User.findOne({where:{username}, attributes: ['id', 'username', 'email', 'photo', 'verified']})
console.log(username)
    if (!user)
    {
        throw createError("هذا الشخص غير موجود",400)
    }
    return user
}



const getUserData = async(username) =>
 {
    let user = await checkUser(username)
    let isBanned = await bannedUser.findOne({where:
        {
             userId: user.id,
        groupId: null,
        timeBanned: { [Op.ne]: null }
        }
    })
    
    let userLastSeen = await lastSeen.findOne({where:{userId:user.id},order:[["createdAt","DESC"]]})
    user.dataValues.isBanned = !!isBanned
    user.dataValues.userLastSeen = userLastSeen
    return user;
 }






 const getAllSeenUser = async(username) => 
 {
    let user = await checkUser(username)
    let userLastSeen = await lastSeen.findAll({where:{userId:user.id},order:[["createdAt","DESC"]]})
    return userLastSeen;
 }


 
 const checkRole = async(user,userId) => {
    if (user.id === userId)
    {
        throw createError("لأ يمكنك حظر نفسك",400)
    }
    else if (user.role === "Admin")
    {
        throw createError("لأ تملك الصلأحيات الكافيه")
    }
 }





const checkUpdateData = async(username,email,password,id,file) => {
    
        let user = await User.findByPk(id)
        if (!user)
        {
            throw createError("هذا المستخدم غير موجود",400)
        }
       let dataAfterChecks =  await updateProfileValdtion(user,username,email,password);
       console.log(dataAfterChecks)
       console.log(dataAfterChecks)
        await valdtionDataUpdate(username,email,user);
        let data = checkUserData(dataAfterChecks)
        if (file)
        {   
            checkPhoto(file)   
            data.photo = file.filename;
        }
       
        let userUpdate = await user.update(data)
        return userUpdate
}





const deletUser = async(id,adminId) => {
    let user = await User.findByPk(id);
    if (!id)
    {
        throw createError("البينات ليست كامله",400)
    }
    else if (!user)
    {
        throw createError("هذا المستخدم غير موجود")
    }
      await checkRole(user,adminId)
    await user.destroy();
}







const checkUpdateProfileStatusData = (followers,UserFollows,likes,profileData) => {
   
    followers =followers ?? profileData.followers
    likes =  likes ?? profileData.likes
    UserFollows =  UserFollows ?? profileData.UserFollows


    return {followers,likes,UserFollows}
}








const getProfiledata = async(id) => {
    let user = await User.findByPk(id)
    if (!user)
    {
        throw createError("هذا المستخدم غير موجود",400)   
    }
    let profileData = await user.getProfile();
     return profileData
}


const updateProfileData = async(id,followers,UserFollows,likes) => {
    let profileData = await getProfiledata(id)
    let data = checkUpdateProfileStatusData(followers,UserFollows,likes,profileData)
     await profileData.update(data)
     return profileData;
}









module.exports = {lastUsers,updateProfileData,getProfiledata,checkRole,deletUser,checkHomeData,checkUpdateData,analyticsVistors,checkUser,createRefreshToken,createAcessToken,getVistors,getAllSeenUser,getUserData,usersNumbers,blogsNumbers}