require('dotenv').config();
const sequelize = require('../config/db');
const { initModels } = require('../models/initModels');
const Admin = require('../models/Admin');
const Department = require('../models/Department');

initModels();

const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // Create Admin if not exists
    const adminEmail = 'admin@gmail.com';
    const existingAdmin = await Admin.findOne({ where: { email: adminEmail } });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin@123', 10);
      await Admin.create({
        name: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN'
      });
      console.log('Default System Admin created.');
    } else {
      console.log('Default System Admin already exists.');
    }

    // Create Departments
    const cse = await Department.create({ name: 'Computer Science', code: 'CSE' });
    const it = await Department.create({ name: 'Information Technology', code: 'IT' });
    const ece = await Department.create({ name: 'Electronics', code: 'ECE' });

    // Create Sections
    const Section = require('../models/Section');
    await Section.create({ name: 'A', departmentId: cse.id });
    await Section.create({ name: 'B', departmentId: cse.id });

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
