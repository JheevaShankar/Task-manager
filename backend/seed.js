const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User.model');
const Task = require('./models/Task.model');
const Department = require('./models/Department.model');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // DELETE ALL EXISTING DATA
    console.log('🗑️  Deleting all existing users...');
    await User.deleteMany({});
    console.log('✅ All users deleted');

    console.log('🗑️  Deleting all existing tasks...');
    await Task.deleteMany({});
    console.log('✅ All tasks deleted');

    console.log('🗑️  Deleting all existing departments...');
    await Department.deleteMany({});
    console.log('✅ All departments deleted');

    // CREATE SUPER ADMIN (JHEEVA)
    console.log('👤 Creating JheevaShankar as SUPER ADMIN...');
    const superAdmin = await User.create({
      name: 'JheevaShankar',
      email: 'jheeva123@gmail.com',
      password: 'Jheeva 8870',
      role: 'SUPER_ADMIN',
      department: null // Super admin doesn't belong to any specific department
    });
    console.log('✅ Super Admin account created:');
    console.log('   Name:', superAdmin.name);
    console.log('   Email:', superAdmin.email);
    console.log('   Role:', superAdmin.role);
    console.log('   ID:', superAdmin._id);

    // CREATE PYTHON DEPARTMENT
    console.log('\n🐍 Creating Python Department...');
    const pythonDept = await Department.create({
      name: 'Python Team',
      description: 'Team responsible for Python development, data science, and backend services',
      color: '#3776ab', // Python blue
      createdBy: superAdmin._id,
      isActive: true
    });
    console.log('✅ Python Department created:', pythonDept.name);

    // CREATE JAVA DEPARTMENT
    console.log('☕ Creating Java Department...');
    const javaDept = await Department.create({
      name: 'Java Team',
      description: 'Team responsible for Java development, enterprise applications, and microservices',
      color: '#f89820', // Java orange
      createdBy: superAdmin._id,
      isActive: true
    });
    console.log('✅ Java Department created:', javaDept.name);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 LOGIN CREDENTIALS:');
    console.log('\n🔑 SUPER ADMIN:');
    console.log('   Email: jheeva123@gmail.com');
    console.log('   Password: Jheeva 8870');
    console.log('   Dashboard: /dashboard (can access all departments)');
    console.log('\n📊 DEPARTMENTS CREATED:');
    console.log('   🐍 Python Team - No members yet');
    console.log('   ☕ Java Team - No members yet');
    console.log('\n💡 You can now add team members through the admin dashboard!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
