import { PrismaClient, Board, Team, User, BoardRole } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export async function seedBoards(teams: Team[], users: User[]): Promise<Board[]> {
  console.log('📋 Seeding boards...');

  if (teams.length === 0) {
    console.log('⚠️ No teams available for board creation');
    return [];
  }

  const boards: Board[] = [];

  for (const team of teams) {
    // Create 1-3 boards per team
    const boardCount = faker.number.int({ min: 1, max: 3 });

    for (let i = 0; i < boardCount; i++) {
      const boardTemplates = [
        { title: 'Sprint Planning', desc: 'Sprint planning and execution board' },
        { title: 'Feature Development', desc: 'New feature development tracking' },
        { title: 'Bug Tracking', desc: 'Bug reports and fixes management' },
        { title: 'Research & Discovery', desc: 'Research tasks and discovery work' },
        { title: 'Product Roadmap', desc: 'Long-term product planning board' },
        { title: 'Marketing Campaign', desc: 'Marketing activities and campaigns' },
      ];

      const template = faker.helpers.arrayElement(boardTemplates);
      const boardColor = faker.color.rgb();

      try {
        const board = await prisma.board.create({
          data: {
            title: template.title,
            description: template.desc,
            color: boardColor,
            organizationId: team.organizationId,
          },
        });

        // Get team members
        const teamMembers = await prisma.teamMember.findMany({
          where: { teamId: team.id },
          include: { user: true },
        });

        // Grant team access to board
        if (teamMembers.length > 0) {
          // Get team leader for grantedBy
          const teamLeader = teamMembers.find(m => m.role === 'LEADER');
          const grantedById = teamLeader?.userId || teamMembers[0].userId;

          await prisma.teamBoardAccess.create({
            data: {
              teamId: team.id,
              boardId: board.id,
              grantedBy: grantedById,
            },
          });

          // Grant individual access to team members
          for (const member of teamMembers) {
            const role = member.role === 'LEADER' 
              ? BoardRole.OWNER 
              : faker.helpers.arrayElement([BoardRole.ADMIN, BoardRole.EDITOR, BoardRole.VIEWER]);

            try {
              await prisma.boardAccess.create({
                data: {
                  userId: member.userId,
                  boardId: board.id,
                  role: role,
                  grantedBy: grantedById,
                },
              });
            } catch (error) {
              // Access might already exist, skip
            }
          }
        }

        // Create default columns for the board
        const defaultColumns = [
          { name: 'Backlog', order: 0, color: '#94a3b8' },
          { name: 'To Do', order: 1, color: '#3b82f6' },
          { name: 'In Progress', order: 2, color: '#f59e0b' },
          { name: 'Review', order: 3, color: '#8b5cf6' },
          { name: 'Done', order: 4, color: '#10b981' },
        ];

        for (const col of defaultColumns) {
          await prisma.column.create({
            data: {
              name: col.name,
              order: col.order,
              color: col.color,
              boardId: board.id,
            },
          });
        }

        boards.push(board);
        console.log(`✅ Created board: ${board.title} for team ${team.name} with ${teamMembers.length} members`);
      } catch (error) {
        console.log(`⚠️ Failed to create board: ${template.title} for team ${team.name}`);
      }
    }
  }

  console.log(`✅ Created ${boards.length} boards`);
  return boards;
}

export async function cleanBoards() {
  console.log('🧹 Cleaning boards...');
  await prisma.teamBoardAccess.deleteMany();
  await prisma.boardAccess.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  console.log('✅ Boards cleaned');
}
