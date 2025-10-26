const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');












const lastSeen = sequelize.define('lastSeen', {
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        allowNull:false,
        autoIncrement:true
    },
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },

},{
    timestamps:true,
    tableName:"LastSeen"
})















module.exports = {lastSeen}