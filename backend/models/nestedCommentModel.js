const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');








const nestedComments = sequelize.define('nestedComments',{
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
    },
    content:{
        type:DataTypes.TEXT,
        allowNull:false
    }
},{
    timestamps:true,
    tableName:"nestedComments"
})








module.exports = {nestedComments}