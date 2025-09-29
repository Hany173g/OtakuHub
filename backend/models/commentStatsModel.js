const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');








const commentStats = sequelize.define('commentStats', {
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
    commentId:{
        type:DataTypes.INTEGER,
        allowNull:false
    }
},{
    tableName:"commentStats",
    timestamps:true
})










module.exports = {commentStats}