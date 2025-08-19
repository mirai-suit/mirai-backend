import { PrismaClient, User } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface UserSeedData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  avatar: string;
}

export async function seedUsers(): Promise<User[]> {
  console.log('🧑‍💼 Seeding users...');

  // Create test users with realistic data
  const users: UserSeedData[] = [];
  const userCount = 15; // Create 15 test users

  for (let i = 0; i < userCount; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const hashedPassword = await bcrypt.hash('Password123', 10);

    const user: UserSeedData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      avatar: faker.image.avatarGitHub(),
    };

    users.push(user);
  }

  // Create users in batches to avoid conflicts
  const createdUsers: User[] = [];
  for (const userData of users) {
    try {
      const user = await prisma.user.create({
        data: userData,
      });
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
    } catch (error) {
      console.log(`⚠️ User ${userData.email} might already exist, skipping...`);
    }
  }

  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
}

export async function cleanUsers() {
  console.log('🧹 Cleaning users...');
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '@'
      }
    }
  });
  console.log('✅ Users cleaned');
}
