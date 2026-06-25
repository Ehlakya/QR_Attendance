require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');

const PORT = process.env.PORT || 5000;

// Test DB connection and sync models
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
    const { initModels } = require('./models/initModels');
    initModels();
    
    // Sync DB (Use { alter: true } to update tables without dropping them)
    // return sequelize.sync({ alter: true });
  })
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    
    // Initialize Socket.io
    const io = require('./config/socket').init(server);
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });
