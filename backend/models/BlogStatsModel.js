const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');








const BlogStats = sequelize.define('BlogStats', {
    id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
    },
    likesNumber:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0
    },
    dislikeNumber:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0
    },
    commentsNumber:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0
    },
    blogId:{
        type:DataTypes.INTEGER,
        allowNull:false
    }
},{
    tableName:"BlogStats",
    timestamps:true
})










module.exports = {BlogStats}