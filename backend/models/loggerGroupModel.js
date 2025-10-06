const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');










const loggerGroup = sequelize.define('loggerGroup', {
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        primaryKey:true,
        autoIncrement:true
    },
    groupId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    status:{
        type:DataTypes.ENUM("join","leave","newOwner","kick")
    },
    username:{
        type:DataTypes.STRING,
        allowNull:false
    },
    photo:{
        type:DataTypes.STRING,
        allowNull:false
    }
},{
    tableName:"loggerGroups",
    timestamps:true
})






module.exports = { loggerGroup}