const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');
















const SecuirtyLogs = sequelize.define("secuirtyLogs", {
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true
    },
    action:{
        type:DataTypes.STRING,
        allowNull:false
    },
    ip:{
        type:DataTypes.STRING,
        allowNull:false
    },
    agent:{
        type:DataTypes.STRING 
    },
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false
    }
},
{
    tableName:"SecuirtyLogs",
    timestamps:true
}
)







module.exports = {SecuirtyLogs}