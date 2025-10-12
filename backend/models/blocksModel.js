
const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');













const blocks = sequelize.define('blocks', {
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        allowNull:false,
        autoIncrement:true
    },  
    sentBlock:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    recivceBlock:{
        type:DataTypes.INTEGER,
        allowNull:false
    }
},
{
    tableName:"Blocks",
    timestamps:true
})













module.exports = {blocks}