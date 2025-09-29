


const {Blogs} = require('../models/blogsModel')
const {commentsBlogs} = require('../models/commentsBlogsModel')
const {User}  =require('../models/userModel')
const {hashPassword} = require('./auth')

const{friends} = require('../models/friendModel')

const {Op, where} = require('sequelize')







const checkDataBlog= ({content,title}) => {
    if (!content||!title)
    {
        throw new Error("البينات ليست كامله")
    }
}



const checkPhoto = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (file.size > 3000000)
    {
        throw new Error("يجب ان يكون الحجم اقصي شي 3 ميجا")
    }
    else  if (!allowedTypes.includes(file.mimetype)) {
        throw new Error("يجب ان يكون الصوره امتداد jpeg or png");
    }
    
}


// check if blog is find

const checkBlog = async(id) => {
        let blog = await Blogs.findByPk(id);
           if (!blog)
           {
            throw new Error("هذا المقال غير موجود او تم حذفه")
           }
           return blog;
        }


const checkAction = (action ,service) => {
    if (service != 'comment' && service != 'blogs')
    {
        throw new Error('يجب ان تختار حدث معين("comment or blogs")')
    }
    if (action != 'like' && action != 'dislike')
    {
        throw new Error('يجب ان تختار حدث معين("like or dislike")')
    }
}





const checkComment = async(id) => {
    let comment = await commentsBlogs.findByPk(id)
    if (!comment)
    {
        throw new Error("هذا التعليق غير موجود او تم حذفه")
    }
    return comment;
}



const updateProfileValdtion = async (user, newUsername, newEmail, newPassword) => {
   
    let username = newUsername || user.username;
    let email = newEmail || user.email;
    let password = newPassword ? await hashPassword(newPassword) : user.password;
   
    return { username, email, password };
};




const checkDataMessage = async(username,content,user) => 
{
    let friend = await User.findOne({where:{username}});

            if (!friend)
            {
                throw new Error("هذا الشخص غير موجود")
            }
            if (content) {
                if (content.length  < 1)
                {
                    throw new Error("لأ تستطيع ارسال رساله بدون محتوي")
                }
                
            }
            else
            {
                throw new Error("البينات ليست كامله")
            }
            let isFriend = await user.getFriends({where:{
                [Op.or]:[
                    {userId:user.id,friendId:friend.id},
                    {userId:friend.id,friendId:user.id}
                ]
         }});
         if (!isFriend)
        {
            throw new Error("انتم لستم اصدقاء")
        }
    return friend;
}





const checkFriendRequestData = async(userId,friendId) => {
        let[user,friend] = await Promise.all([
            User.findByPk(userId),
            User.findByPk(friendId),
            
        ])
    if (!user || !friend)
    {
        throw new Error("هذا المستخدم غير موجود")
    }
  
}









module.exports = {checkDataBlog,checkDataMessage,checkPhoto,checkBlog,checkAction,checkComment,updateProfileValdtion,checkFriendRequestData}