const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');








const dislikeComments = sequelize.define('dislikeComments',{
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    userId:{
        type:DataTypes.INTEGER,
    },
    commentId:{
        type:DataTypes.INTEGER
    }
},{
    timestamps:true,
    tableName:"dislikeComments"
})





module.exports = {dislikeComments}