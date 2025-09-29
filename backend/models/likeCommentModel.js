const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');








const likesComments = sequelize.define('likesComments',{
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
    tableName:"likesComments"
})





module.exports = {likesComments}