const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');













const Groups = sequelize.define('Groups', {
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        allowNull:false,
        autoIncrement:true
    },
    description:{
        type:DataTypes.TEXT,
        allowNull:false,
    },
    numberMembers:{
        type:DataTypes.INTEGER,
        defaultValue:1
    },
    privacy: {
    type: DataTypes.ENUM('private','public'),
    defaultValue: 'public'
    },
    photo:{
        type:DataTypes.STRING,
        allowNull:false
    },

    name:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    }
},
{
    tableName:"Groups_",
    tableName:false
})




module.exports = {Groups}