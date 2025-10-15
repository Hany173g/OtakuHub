



const { Sequelize, Op } = require('sequelize');
const{Groups,User,Blogs, BlogStats, commentsBlogs}  =require('../models/Relationships')

const{getBlogs} = require('../service/getBlogs');
const { RAW } = require('sequelize/lib/query-types');
const {checkStatsUsers,checkGroupStats,checkBlogsStats}= require('../utils/checkData');
const sequelize = require('../config/database');






exports.seacrchEngine = async(req,res,next) => {
    try{
        const{value} = req.body;
        let user;
        if (req.user)
        {
         user = await User.findOne({where:{id:req.user.id}})
        }
        const users = await User.findAll({
            where:Sequelize.literal(`MATCH (username) AGAINST ('+${value}*' IN BOOLEAN MODE)`),attributes:["id","username"]
        })
        const blogs = await Blogs.findAll({
            where:
            {
                [Op.and]:[
                    Sequelize.literal(`MATCH(content,title) AGAINST('+${value}*' IN BOOLEAN MODE)`),
                ],
            },
            include:[
                {model:commentsBlogs},
            ]
            ,limit:20
        })
       let groups = await Groups.findAll({
        where:Sequelize.literal(`MATCH(description,name) AGAINST('+${value}*' IN BOOLEAN MODE)`)
        })
        let blogsStats = await getBlogs(req,res,"search",user,null,blogs)
        let userStats = await checkStatsUsers(users,user)
       let groupsStats =  await checkGroupStats(groups,user)
       let blogsData =   await checkBlogsStats(blogsStats)

        res.status(200).json({userStats,blogsData,groupsStats});
    }catch(err)
    {
       next(err)
    }
}












