require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // This will create a file named database.sqlite in the Backend folder
  logging: false,
});

module.exports = sequelize;
