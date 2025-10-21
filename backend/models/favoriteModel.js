const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');













const Favorite = sequelize.define("Favorite",{
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true,
    },
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    blogId:{
        type:DataTypes.INTEGER,
        allowNull:false
    }
},
{
    timestamps:true,
    tableName:"Favorites"
})










module.exports = {Favorite}