import { PrismaClient } from '@prisma/client';
import { seedUsers, cleanUsers } from './users.seed';
import { seedOrganizations, cleanOrganizations } from './organizations.seed';
import { seedTeams, cleanTeams } from './teams.seed';
import { seedBoards, cleanBoards } from './boards.seed';
import { seedTasks, cleanTasks } from './tasks.seed';
import { seedPerformanceMetrics, cleanPerformanceMetrics } from './performance.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Clean existing data in reverse order (to handle foreign key constraints)
    console.log('\n🧹 Cleaning existing data...');
    await cleanPerformanceMetrics();
    await cleanTasks();
    await cleanBoards();
    await cleanTeams();
    await cleanOrganizations();
    
    // Clean additional models that reference users
    console.log('🧹 Cleaning messages and other user-dependent data...');
    await prisma.message.deleteMany();
    await prisma.messageThread.deleteMany();
    await prisma.note.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.invitation.deleteMany();
    
    await cleanUsers();

    // Seed data in correct order (respecting foreign key dependencies)
    console.log('\n🌱 Seeding fresh data...');
    
    // Step 1: Create users
    const users = await seedUsers();
    console.log(`✅ Seeded ${users.length} users`);

    // Step 2: Create organizations with user relationships
    const organizations = await seedOrganizations(users);
    console.log(`✅ Seeded ${organizations.length} organizations`);

    // Step 3: Create teams with members
    const teams = await seedTeams(organizations, users);
    console.log(`✅ Seeded ${teams.length} teams`);

    // Step 4: Create boards with access controls and columns
    const boards = await seedBoards(teams, users);
    console.log(`✅ Seeded ${boards.length} boards`);

    // Step 5: Create tasks with assignees and activity logs
    const tasks = await seedTasks(boards, users);
    console.log(`✅ Seeded ${tasks.length} tasks`);

    // Step 6: Create performance metrics
    const metrics = await seedPerformanceMetrics();
    console.log(`✅ Seeded ${metrics.length} performance metrics`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🏢 Organizations: ${organizations.length}`);
    console.log(`   👥 Teams: ${teams.length}`);
    console.log(`   📋 Boards: ${boards.length}`);
    console.log(`   📝 Tasks: ${tasks.length}`);
    console.log(`   📈 Performance Metrics: ${metrics.length}`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
