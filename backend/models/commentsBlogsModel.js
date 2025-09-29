const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');








const commentsBlogs = sequelize.define('commentsBlogs',{
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    userId:{
        type:DataTypes.INTEGER,
    },
    blogId:{
        type:DataTypes.INTEGER
    },
    content:{
        type:DataTypes.TEXT,
        allowNull:false
    }
},{
    timestamps:true,
    tableName:"commentsBlogs"
})








module.exports = {commentsBlogs}