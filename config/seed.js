require('dotenv').config();
const { createUser } = require('../src/models/User');
const { createLocation } = require('../src/models/Location');
const { closePool } = require('../src/db/connection');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    console.log('Creating default locations...');
    const locations = [
      { name: 'Warehouse A', description: 'Main storage facility' },
      { name: 'Warehouse B', description: 'Secondary storage facility' },
      { name: 'Loading Dock', description: 'Receiving and shipping area' }
    ];
    
    for (const loc of locations) {
      try {
        await createLocation(loc.name, loc.description);
        console.log(`  ✓ Created location: ${loc.name}`);
      } catch (error) {
        if (error.code === '23505') {
          console.log(`  - Location already exists: ${loc.name}`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\nCreating default users...');
    const users = [
      { username: 'manager', password: 'manager123', role: 'MANAGER' },
      { username: 'staff', password: 'staff123', role: 'WAREHOUSE_STAFF' }
    ];
    
    for (const userData of users) {
      try {
        await createUser(userData.username, userData.password, userData.role);
        console.log(`  ✓ Created user: ${userData.username} (${userData.role})`);
      } catch (error) {
        if (error.code === '23505') {
          console.log(`  - User already exists: ${userData.username}`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nDefault credentials:');
    console.log('  Manager: username=manager, password=manager123');
    console.log('  Staff: username=staff, password=staff123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
