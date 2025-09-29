const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');










const requestFriend = sequelize.define('requestFriend',{
    id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true,
        allowNull:false
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
    tableName:'requestFriend',
    timestamps:true
})






module.exports = {requestFriend};
