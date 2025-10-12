const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');













const report = sequelize.define('report', {
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true
    },
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false,
    },
    groupId:{
        type:DataTypes.INTEGER,
        defaultValue:null
    },
    content:{
        type:DataTypes.TEXT,
    },
    serviceId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    service:{
        type:DataTypes.ENUM("comment","blog"),
        allowNull:false
    }
},{
    tableName:"reports",
    timestamps:true
})





module.exports = {report}