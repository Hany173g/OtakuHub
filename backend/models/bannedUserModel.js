
const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');



















const bannedUser = sequelize.define("bannedUser",{
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
    groupId:{
        type:DataTypes.INTEGER
    }
},
{
    timestamps:true,
    tableName:"BannedUsers"
})












module.exports = {bannedUser}