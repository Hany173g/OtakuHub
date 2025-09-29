const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');








const dislikesBlogs = sequelize.define('dislikesBlogs',{
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
    tableName:"dislikesBlogs"
})





module.exports = {dislikesBlogs}