const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');










const privateMessage = sequelize.define('privateMessages',{
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true
    },
    senderId:{
        type:DataTypes.INTEGER,
        allowNull:false,
    },
    receiveId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    content:{
        type:DataTypes.TEXT,
        allowNull:false
    },
    isDelete:{
        type:DataTypes.BOOLEAN,
        defaultValue:false
    }
    
},{
    tableName:"privateMessages",
    timestamps:true
})



module.exports = {privateMessage};