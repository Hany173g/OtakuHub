const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');













const viewBlogs = sequelize.define("ViewBlogs", {
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true
    },
    blogId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false
    }
},{
    timestamps:true,
    tableName:"ViewBlogs"
})








module.exports = {viewBlogs}