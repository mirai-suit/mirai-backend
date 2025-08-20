import { PrismaClient, Task, Board, User, TaskStatus, TaskPriority, Team } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export async function seedTasks(boards: Board[], users: User[]): Promise<Task[]> {
  console.log('📝 Seeding tasks...');

  if (boards.length === 0) {
    console.log('⚠️ No boards available for task creation');
    return [];
  }

  const tasks: Task[] = [];

  for (const board of boards) {
    // Get board columns
    const columns = await prisma.column.findMany({
      where: { boardId: board.id },
      orderBy: { order: 'asc' },
    });

    if (columns.length === 0) continue;

    // Get teams that have access to this board
    const teamsWithAccess = await prisma.teamBoardAccess.findMany({
      where: { boardId: board.id },
      include: { 
        team: {
          include: {
            members: {
              include: { user: true }
            }
          }
        }
      },
    });

    if (teamsWithAccess.length === 0) continue;

    // Create 8-15 tasks per board
    const taskCount = faker.number.int({ min: 8, max: 15 });

    for (let i = 0; i < taskCount; i++) {
      const taskTemplates = [
        'Implement user authentication system',
        'Design responsive dashboard layout',
        'Set up database migrations',
        'Write unit tests for API endpoints',
        'Optimize application performance',
        'Fix critical bug in payment processing',
        'Create user onboarding flow',
        'Implement real-time notifications',
        'Design mobile-first interface',
        'Set up CI/CD pipeline',
        'Refactor legacy codebase',
        'Integrate third-party analytics',
        'Implement data validation',
        'Create API documentation',
        'Set up monitoring alerts',
        'Design loading states',
        'Implement search functionality',
        'Create backup system',
        'Optimize database queries',
        'Implement file upload feature',
      ];

      const taskTitle = faker.helpers.arrayElement(taskTemplates);
      const taskDescription = faker.lorem.paragraphs(2);
      
      // Select a random team that has access to this board
      const selectedTeamAccess = faker.helpers.arrayElement(teamsWithAccess);
      const selectedTeam = selectedTeamAccess.team;
      
      const column = faker.helpers.arrayElement(columns);
      
      // Set task status based on column
      let status: TaskStatus = TaskStatus.NOT_STARTED;
      if (column.name.toLowerCase().includes('progress')) {
        status = TaskStatus.IN_PROGRESS;
      } else if (column.name.toLowerCase().includes('review')) {
        status = TaskStatus.UNDER_REVIEW;
      } else if (column.name.toLowerCase().includes('done')) {
        status = TaskStatus.COMPLETED;
      }

      const priority = faker.helpers.arrayElement([
        TaskPriority.LOWEST,
        TaskPriority.LOW,
        TaskPriority.MEDIUM,
        TaskPriority.HIGH,
        TaskPriority.HIGHEST,
      ]);

      // Set realistic dates
      const createdAt = faker.date.between({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date(),
      });

      let startDate: Date | null = null;
      let dueDate = faker.date.between({
        from: new Date(),
        to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      });

      if (status === TaskStatus.IN_PROGRESS || status === TaskStatus.UNDER_REVIEW || status === TaskStatus.COMPLETED) {
        startDate = faker.date.between({
          from: createdAt,
          to: new Date(),
        });
      }

      try {
        // Create task with team assignment
        const task = await prisma.task.create({
          data: {
            title: taskTitle,
            description: taskDescription,
            status: status,
            priority: priority,
            dueDate: dueDate,
            startDate: startDate,
            boardId: board.id,
            columnId: column.id,
            teamId: selectedTeam.id, // Assign to team instead of individual
            order: i,
            createdAt: createdAt,
            updatedAt: status === TaskStatus.COMPLETED ? faker.date.between({ from: startDate || createdAt, to: new Date() }) : createdAt,
            // Connect all team members as assignees automatically
            assignees: {
              connect: selectedTeam.members.map(member => ({ id: member.userId }))
            }
          },
        });

        // Create task activity logs for team assignment
        const teamLeader = selectedTeam.members.find(m => m.role === 'LEADER');
        const creatorUserId = teamLeader?.userId || selectedTeam.members[0]?.userId;

        if (creatorUserId) {
          await prisma.taskActivityLog.create({
            data: {
              taskId: task.id,
              userId: creatorUserId,
              action: 'CREATED',
              timestamp: createdAt,
            },
          });

          if (startDate) {
            // Random team member starts the task
            const randomMember = faker.helpers.arrayElement(selectedTeam.members);
            await prisma.taskActivityLog.create({
              data: {
                taskId: task.id,
                userId: randomMember.userId,
                action: 'STARTED',
                timestamp: startDate,
              },
            });
          }

          if (status === TaskStatus.COMPLETED) {
            const completedAt = faker.date.between({
              from: startDate || createdAt,
              to: new Date(),
            });

            // Random team member completes the task
            const randomMember = faker.helpers.arrayElement(selectedTeam.members);
            await prisma.taskActivityLog.create({
              data: {
                taskId: task.id,
                userId: randomMember.userId,
                action: 'COMPLETED',
                timestamp: completedAt,
              },
            });
          }
        }

        tasks.push(task);
      } catch (error) {
        console.log(`⚠️ Failed to create task: ${taskTitle}`, error);
      }
    }

    console.log(`✅ Created ${taskCount} tasks for board: ${board.title}`);
  }

  console.log(`✅ Created ${tasks.length} total tasks`);
  return tasks;
}

export async function cleanTasks() {
  console.log('🧹 Cleaning tasks...');
  await prisma.taskActivityLog.deleteMany();
  await prisma.task.deleteMany();
  console.log('✅ Tasks cleaned');
}
