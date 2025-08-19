import { PrismaClient, Task, Board, User, TaskStatus, TaskPriority } from '@prisma/client';
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

    // Get board members
    const boardMembers = await prisma.boardAccess.findMany({
      where: { boardId: board.id },
      include: { user: true },
    });

    if (boardMembers.length === 0) continue;

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
      const assignee = faker.helpers.arrayElement(boardMembers);
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
            order: i,
            createdAt: createdAt,
            updatedAt: status === TaskStatus.COMPLETED ? faker.date.between({ from: startDate || createdAt, to: new Date() }) : createdAt,
            assignees: {
              connect: { id: assignee.userId }
            }
          },
        });

        // Create task activity logs for realistic history
        await prisma.taskActivityLog.create({
          data: {
            taskId: task.id,
            userId: assignee.userId,
            action: 'CREATED',
            timestamp: createdAt,
          },
        });

        if (startDate) {
          await prisma.taskActivityLog.create({
            data: {
              taskId: task.id,
              userId: assignee.userId,
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

          await prisma.taskActivityLog.create({
            data: {
              taskId: task.id,
              userId: assignee.userId,
              action: 'COMPLETED',
              timestamp: completedAt,
            },
          });
        }

        // Add some random additional assignees (30% chance)
        if (faker.datatype.boolean({ probability: 0.3 }) && boardMembers.length > 1) {
          const additionalAssignees = faker.helpers.arrayElements(
            boardMembers.filter(m => m.userId !== assignee.userId),
            faker.number.int({ min: 1, max: 2 })
          );

          for (const additionalAssignee of additionalAssignees) {
            try {
              await prisma.task.update({
                where: { id: task.id },
                data: {
                  assignees: {
                    connect: { id: additionalAssignee.userId }
                  }
                }
              });
            } catch (error) {
              // Assignee might already exist, skip
            }
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
