const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User.model');
const Task = require('./models/Task.model');

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

    // CREATE JHEEVA SHANKAR AS MANAGER
    console.log('👤 Creating JheevaShankar as MANAGER...');
    const manager = await User.create({
      name: 'JheevaShankar',
      email: 'jheeva123@gmail.com',
      password: 'Jheeva 8870',
      role: 'MANAGER'
    });
    console.log('✅ Manager account created:');
    console.log('   Name:', manager.name);
    console.log('   Email:', manager.email);
    console.log('   Role:', manager.role);
    console.log('   ID:', manager._id);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 LOGIN CREDENTIALS:');
    console.log('   Email: jheeva123@gmail.com');
    console.log('   Password: Jheeva 8870');
    console.log('   Dashboard: /manager/dashboard');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
