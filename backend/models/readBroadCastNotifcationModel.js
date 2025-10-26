const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');















const readBroadcastNotifcation = sequelize.define("ReadBroadCastNotfcs" ,{
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
    notfcsId:{
        type:DataTypes.INTEGER,
        allowNull:false
    }
},
{
    timestamps:true,
    tableName:"ReadBroadCastNotifaction"
})








module.exports = {readBroadcastNotifcation}