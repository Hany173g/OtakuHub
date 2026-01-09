const { removeDislike } = require("../controllers/blogContoller")




const addBlogPoints = async(user,blog,content) => {
    let isPhoto = user.photo === "default" ? 0 : 70
    let isVerify = user.verify ? 700 : 0
    let isContentLength = content.length >= 50 ? 50 : 0
    let allPoints = user.points  + isPhoto + isVerify  + isContentLength
    await blog.update({blogPoints:allPoints})
}









const statusSerivce = async(blog,service) => {
    let lastPointsUpdate = blog.lastPointsUpdate || blog.createdAt
    let diff = Date.now() - new Date(lastPointsUpdate)
    let week = 1000 * 60 * 60 * 24 * 7
    let minPoints = diff >= week ? blog.blogPoints > 2000 ? 300 : 0 : 0
    let statusPlus = {
        like:10,
        comment:20,
        favorite:10,
        removeDislike: 10
    }
    let statusMinus = {
        dislike:10,
        removeLike:10,
        removeComment:15,
        removeLike:10
    }
    let subPoints = statusPlus[service] || 0;
    let minsPoints = statusMinus[service] ? statusMinus[service] : 0
    let minus = (blog.blogPoints - minPoints) > 0 ? true: null
    if (minus)
    {
        await blog.decrement('blogPoints', { by: minsPoints }) 
    }
    if (subPoints > 1)
    {
         await blog.increment('blogPoints', { by: subPoints }) 
    }
}






module.exports = {addBlogPoints,statusSerivce}