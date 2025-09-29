const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');








let resetToken = sequelize.define("resetToken", {
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true
    },
    token:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:false
    },
    expiredToken:{
        type:DataTypes.BIGINT,
        allowNull:false
    }
},{
    timestamps:true,
    tableName:"resetTokens"
})



module.exports = {resetToken}