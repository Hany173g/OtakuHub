const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');








const likesBlogs = sequelize.define('likesBlogs',{
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
    }
},{
    timestamps:true,
    tableName:"likesBlogs"
})





module.exports = {likesBlogs}