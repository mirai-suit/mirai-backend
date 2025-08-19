import { PrismaClient, Team, Organization, User, TeamRole } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export async function seedTeams(organizations: Organization[], users: User[]): Promise<Team[]> {
  console.log('👥 Seeding teams...');

  if (organizations.length === 0 || users.length === 0) {
    console.log('⚠️ No organizations or users available for team creation');
    return [];
  }

  const teams: Team[] = [];

  for (const org of organizations) {
    // Get organization members
    const orgMembers = await prisma.organizationUser.findMany({
      where: { organizationId: org.id },
      include: { user: true },
    });

    if (orgMembers.length === 0) continue;

    // Create 2-4 teams per organization
    const teamCount = faker.number.int({ min: 2, max: 4 });

    for (let i = 0; i < teamCount; i++) {
      const teamNames = [
        'Frontend Development', 'Backend Development', 'DevOps & Infrastructure',
        'Product Design', 'Quality Assurance', 'Data Science', 'Mobile Development',
        'Platform Engineering', 'Security Team', 'Analytics Team'
      ];

      const teamName = faker.helpers.arrayElement(teamNames);
      const leader = faker.helpers.arrayElement(orgMembers);
      const teamColor = faker.internet.color();

      try {
        const team = await prisma.team.create({
          data: {
            name: teamName,
            description: faker.lorem.sentence(),
            color: teamColor,
            organizationId: org.id,
            leaderId: leader.userId,
            objectives: faker.lorem.sentences(2),
          },
        });

        // Add team leader as team member
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: leader.userId,
            role: TeamRole.LEADER,
          },
        });

        // Add 3-7 random members to the team
        const memberCount = faker.number.int({ min: 3, max: 7 });
        const availableMembers = orgMembers.filter(m => m.userId !== leader.userId);
        const selectedMembers = faker.helpers.arrayElements(availableMembers, Math.min(memberCount, availableMembers.length));

        for (const member of selectedMembers) {
          try {
            await prisma.teamMember.create({
              data: {
                teamId: team.id,
                userId: member.userId,
                role: TeamRole.MEMBER,
              },
            });
          } catch (error) {
            // Member might already be in team, skip
          }
        }

        teams.push(team);
        console.log(`✅ Created team: ${team.name} in ${org.name} with ${selectedMembers.length + 1} members`);
      } catch (error) {
        console.log(`⚠️ Failed to create team: ${teamName} in ${org.name}`);
      }
    }
  }

  console.log(`✅ Created ${teams.length} teams`);
  return teams;
}

export async function cleanTeams() {
  console.log('🧹 Cleaning teams...');
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  console.log('✅ Teams cleaned');
}
