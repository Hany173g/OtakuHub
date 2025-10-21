const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');











const groupSettings = sequelize.define('groupSettings', {
    id :{ 
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true
    },
    publish:{
        type:DataTypes.BOOLEAN,
        defaultValue:true
    },
    allowReports:{
        type:DataTypes.BOOLEAN,
        defaultValue:true
    },
    groupId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    warringNumbers:{
        type:DataTypes.INTEGER,
        defaultValue:3
    }

},{
    tableName:"groupSettings",
    timestamps:true
})






module.exports = {groupSettings}