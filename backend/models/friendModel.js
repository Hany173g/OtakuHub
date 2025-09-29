const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');











const friends = sequelize.define('friends',{
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement:true,
        unique:true,
        primaryKey:true
    },
    friendId:{
        type:DataTypes.INTEGER,
        allowNull:false,
        
    },
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false
    }
},
{
    tableName:"friends",
    timestamps:true
})






module.exports = {friends}