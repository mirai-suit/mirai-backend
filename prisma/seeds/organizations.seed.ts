import { PrismaClient, Organization, User, OrganizationRole } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export async function seedOrganizations(users: User[]): Promise<Organization[]> {
  console.log('🏢 Seeding organizations...');

  if (users.length === 0) {
    console.log('⚠️ No users available for organization creation');
    return [];
  }

  const organizations: Organization[] = [];
  const orgCount = 3; // Create 3 test organizations

  for (let i = 0; i < orgCount; i++) {
    const creator = faker.helpers.arrayElement(users);
    const orgName = faker.company.name();

    try {
      const organization = await prisma.organization.create({
        data: {
          name: orgName,
          creatorId: creator.id,
        },
      });

      // Add creator as ADMIN of the organization
      await prisma.organizationUser.create({
        data: {
          organizationId: organization.id,
          userId: creator.id,
          role: OrganizationRole.ADMIN,
        },
      });

      // Add 5-10 random users as members
      const memberCount = faker.number.int({ min: 5, max: 10 });
      const availableUsers = users.filter(u => u.id !== creator.id);
      const selectedMembers = faker.helpers.arrayElements(availableUsers, memberCount);

      for (const member of selectedMembers) {
        try {
          await prisma.organizationUser.create({
            data: {
              organizationId: organization.id,
              userId: member.id,
              role: faker.helpers.arrayElement([OrganizationRole.ADMIN, OrganizationRole.MEMBER]),
            },
          });
        } catch (error) {
          // User might already be in organization, skip
        }
      }

      organizations.push(organization);
      console.log(`✅ Created organization: ${organization.name} with ${memberCount + 1} members`);
    } catch (error) {
      console.log(`⚠️ Failed to create organization: ${orgName}`);
    }
  }

  console.log(`✅ Created ${organizations.length} organizations`);
  return organizations;
}

export async function cleanOrganizations() {
  console.log('🧹 Cleaning organizations...');
  await prisma.organizationUser.deleteMany();
  await prisma.organization.deleteMany();
  console.log('✅ Organizations cleaned');
}
