


const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');







const pendingRequestsGroup = sequelize.define('pendingRequestsGroup',{
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
    groupId:{
        type:DataTypes.INTEGER,
        allowNull:false
    }
},{
    tableName:"pendingRequestsGroup",
    timestamps: true
})





module.exports = {pendingRequestsGroup}







