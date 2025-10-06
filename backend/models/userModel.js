const {DataTypes} = require('sequelize');


const sequelize = require('../config/database');





sequelize.sync({ alter: true }) // alter: يحاول يطابق الجدول مع الموديل
  .then(() => {
    console.log("All tables are synced!");
  })
  .catch(err => console.log("Error syncing tables:", err));



const User = sequelize.define('User',{
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement: true,
        primaryKey:true
    },
    username:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    password:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    email:{
        type:DataTypes.STRING,
        allowNull:false
    },
    role:{
        type:DataTypes.STRING,
        allowNull:false,
        defaultValue:'User'
    },
    photo:{
        type:DataTypes.STRING,
        defaultValue:'default'
    }
},{
    tableName:"Users",
    timestamps:true
})





module.exports = {User}





