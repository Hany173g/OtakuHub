const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');











const historyDeleteGroup = sequelize.define('historyDeleteGroup', {
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true
    },
    groupId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    administratorDelete:{
        type:DataTypes.STRING,
        allowNull:false
    },
    usernameOwnerBlogDelete:{
        type:DataTypes.STRING,
        allowNull:false
    },
    ownerInThisTime:{
        type:DataTypes.STRING,
        allowNull:false
    },
    contentDelete:{
        type:DataTypes.STRING,
        allowNull:false
    },
    roleDeleteBlog:{
        type:DataTypes.STRING,
        allowNull:false
    },
    service:{
        type:DataTypes.ENUM("comment","blog"),
        allowNull:false
    }
},{
    tableName:"historyDeleteGroups",
    timestamps:true
})





module.exports = {historyDeleteGroup};

