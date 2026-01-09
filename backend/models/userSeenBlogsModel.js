const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');
















const userSeenBlogs = sequelize.define("UserSeenBlogs",{
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true
    },
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    blogId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    groupId:{
        type:DataTypes.INTEGER
    }
},{
    timestamps:true,
    tableName:"UserSeenBlogs"
})




module.exports = {userSeenBlogs}