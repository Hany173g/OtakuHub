const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');









const Blogs = sequelize.define("Blog",{
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
    content:{
        type:DataTypes.TEXT,
        allowNull:false
    },
    photo:{
        type:DataTypes.STRING,
    },
    title:{
        type:DataTypes.STRING,
        allowNull:false,
    }
},
{
    timestamps:true,
    tableName:"Blogs"
})




module.exports = {Blogs}