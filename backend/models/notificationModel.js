const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');









const Notification = sequelize.define("Notifcation",{
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
    serviceId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    serviceType:{
        type:DataTypes.ENUM("joinGroup","kickGroup","cancelPenningUser","likeBlog","newComment","likeComment","dislikeComment","dislikeBlog"),
        allowNull:false
    },
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    doAction:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    isRead:{
        type:DataTypes.BOOLEAN,
        defaultValue:false
    }
},
{
    tableName:"Notifications",
    timestamps:true
})










module.exports = {Notification}



