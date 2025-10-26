const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');











const Visits = sequelize.define("Visits",{
    id:{
        type:DataTypes.INTEGER,
        allowNull:true,
        autoIncrement:true,
        primaryKey:true
    },
    userId:{
        type:DataTypes.STRING,
    },
    ip:{
        type:DataTypes.STRING
    },
    agent:{
        type:DataTypes.STRING
    },
    url:{
        type:DataTypes.STRING
    }
},{
    timestamps:true,
    tableName:"Visits"
})






module.exports = {Visits}