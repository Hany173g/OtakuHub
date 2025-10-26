const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');









const broadCastNotifcation = sequelize.define("Notifcation",{
    id :{
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true
    },
    content:{
        type:DataTypes.STRING,
        allowNull:false
    },
    type:{
        type:DataTypes.ENUM("warring","info","update"),
        defaultValue:"info"
    }
},
{
    tableName:"BroadCastNotifcation",
    timestamps:true
})






module.exports = {broadCastNotifcation}