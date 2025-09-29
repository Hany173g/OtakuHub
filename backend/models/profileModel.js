const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');










const Profile = sequelize.define('profile',{
    id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true,
        allowNull:null
    },
    likes:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0
    },
    followers:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0
    },
    UserFollows:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0
    },
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false
    }
},{
    tableName:'profiles',
    timestamps:true
})






module.exports = {Profile};



