

const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');














const warringUser = sequelize.define("warringUser",{
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    groupId:{
        type:DataTypes.INTEGER,
    },
    reason:{
        type:DataTypes.STRING
    },
    warringNumbers: {
        type:DataTypes.INTEGER,
        defaultValue:0
    },
    warnedBy:{
        type:DataTypes.INTEGER,
        allowNull:false
    }

},{
    tableName:"WarringUser",
    timestamps:true
})









module.exports = {warringUser}