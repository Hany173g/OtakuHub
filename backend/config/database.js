const {Sequelize} = require('sequelize');



require('dotenv').config()



const sequelize  = new Sequelize(process.env.NAME_DB,process.env.USERNAME_DB,process.env.PASSWORD_DB,{
    host:process.env.HOST,
    dialect:process.env.DIALECT,
    logging: false
});






sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });


  module.exports = sequelize