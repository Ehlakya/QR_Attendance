const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // true to allow Google OAuth users who don't have passwords
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'ADMIN',
  }
}, {
  timestamps: true,
  tableName: 'admins'
});

module.exports = Admin;
