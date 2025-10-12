
const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');












const penningBlogs = sequelize.define("penningBlogs",{
    id:{
        type:DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:true
    },
    blogId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    groupId:{
        type:DataTypes.INTEGER,
        allowNull:false
    }
},{
    timestamps:true,
    tableName:"penningBlogs"
})





module.exports = {penningBlogs}

















