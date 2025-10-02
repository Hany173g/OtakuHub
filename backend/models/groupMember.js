const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');






const GroupMember = sequelize.define('GroupMember',{
    id :{
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true,
    },
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    groupId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    role:{
        type:DataTypes.STRING,
        defaultValue:"Member"
    }
},
{
    tableName:"GroupMembers",
    timestamps:true
})









module.exports = {GroupMember}