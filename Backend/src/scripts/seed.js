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
    const masterDepartments = [
      { id: 1, name: 'Computer Science and Engineering', code: 'CSE' },
      { id: 2, name: 'Information Technology', code: 'IT' },
      { id: 3, name: 'Artificial Intelligence and Machine Learning', code: 'AI & ML' },
      { id: 4, name: 'Data Science', code: 'DS' },
      { id: 5, name: 'Cyber Security', code: 'CS' },
      { id: 6, name: 'Mechanical Engineering', code: 'ME' },
      { id: 7, name: 'Civil Engineering', code: 'CE' },
      { id: 8, name: 'Electrical and Electronics Engineering', code: 'EEE' },
      { id: 9, name: 'Electronics and Communication Engineering', code: 'ECE' },
      { id: 10, name: 'Chemical Engineering', code: 'ChemE' },
      { id: 11, name: 'Aerospace Engineering', code: 'AE' },
      { id: 12, name: 'Biomedical Engineering', code: 'BME' },
      { id: 13, name: 'Biotechnology', code: 'BT' },
      { id: 14, name: 'Mechatronics Engineering', code: 'MTE' },
      { id: 15, name: 'Automobile Engineering', code: 'AutoE' },
      { id: 16, name: 'Agricultural Engineering', code: 'AgE' },
      { id: 17, name: 'Marine Engineering', code: 'MarE' },
      { id: 18, name: 'Textile Technology', code: 'TT' },
      { id: 19, name: 'Applied Sciences and Humanities', code: 'ASH' },
      { id: 20, name: 'Mathematics', code: 'Math' },
      { id: 21, name: 'Physics', code: 'Phy' },
      { id: 22, name: 'Chemistry', code: 'Chem' }
    ];
    await Department.bulkCreate(masterDepartments);

    // Create Sections for CSE (id: 1) as an example
    const Section = require('../models/Section');
    await Section.create({ name: 'A', departmentId: 1 });
    await Section.create({ name: 'B', departmentId: 1 });

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
