import { PrismaClient, UserPerformanceMetrics, PerformancePeriod, TeamMember, Task } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export async function seedPerformanceMetrics(): Promise<UserPerformanceMetrics[]> {
  console.log('📈 Seeding performance metrics...');

  // Get all team members with their tasks
  const teamMembers = await prisma.teamMember.findMany({
    include: {
      user: true,
      team: {
        include: {
          boardAccess: {
            include: {
              board: {
                include: {
                  tasks: {
                    include: {
                      assignees: true,
                      activityLogs: true,
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
  });

  if (teamMembers.length === 0) {
    console.log('⚠️ No team members found for performance metrics');
    return [];
  }

  const metrics: UserPerformanceMetrics[] = [];

  for (const teamMember of teamMembers) {
    // Get all tasks assigned to this user across all team boards
    const userTasks: Task[] = [];
    
    for (const boardAccess of teamMember.team.boardAccess) {
      const boardTasks = boardAccess.board.tasks.filter(task => 
        task.assignees.some(assignee => assignee.id === teamMember.userId)
      );
      userTasks.push(...boardTasks);
    }

    // Create metrics for different periods (last 3 months)
    const periods = [
      {
        type: PerformancePeriod.WEEKLY,
        weeksBack: 12, // Last 12 weeks
      },
      {
        type: PerformancePeriod.MONTHLY,
        monthsBack: 3, // Last 3 months
      },
    ];

    for (const periodConfig of periods) {
      let periodsBack = periodConfig.type === PerformancePeriod.WEEKLY ? periodConfig.weeksBack : periodConfig.monthsBack;
      
      for (let i = 0; i < periodsBack; i++) {
        let periodStart: Date;
        let periodEnd: Date;

        if (periodConfig.type === PerformancePeriod.WEEKLY) {
          // Weekly periods
          periodEnd = new Date();
          periodEnd.setDate(periodEnd.getDate() - (i * 7));
          periodEnd.setHours(23, 59, 59, 999);

          periodStart = new Date(periodEnd);
          periodStart.setDate(periodStart.getDate() - 6);
          periodStart.setHours(0, 0, 0, 0);
        } else {
          // Monthly periods
          periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() - i);
          periodEnd.setDate(0); // Last day of previous month
          periodEnd.setHours(23, 59, 59, 999);

          periodStart = new Date(periodEnd);
          periodStart.setDate(1);
          periodStart.setHours(0, 0, 0, 0);
        }

        // Filter tasks for this period
        const periodTasks = userTasks.filter(task => {
          const taskDate = task.createdAt;
          return taskDate >= periodStart && taskDate <= periodEnd;
        });

        const completedTasks = periodTasks.filter(task => task.status === 'COMPLETED');
        const inProgressTasks = periodTasks.filter(task => task.status === 'IN_PROGRESS');
        const overdueTasks = periodTasks.filter(task => {
          return task.dueDate && task.dueDate < new Date() && task.status !== 'COMPLETED';
        });

        // Calculate time metrics
        const completedOnTime = completedTasks.filter(task => {
          if (!task.dueDate) return true; // No due date = on time
          return task.updatedAt <= task.dueDate;
        });

        const completedLate = completedTasks.filter(task => {
          if (!task.dueDate) return false;
          return task.updatedAt > task.dueDate;
        });

        // Calculate realistic metrics
        const tasksAssigned = periodTasks.length;
        const tasksCompleted = completedTasks.length;
        const tasksInProgress = inProgressTasks.length;
        const tasksOverdue = overdueTasks.length;
        const tasksCompletedOnTime = completedOnTime.length;
        const tasksCompletedLate = completedLate.length;

        // Calculate working time (8 hours per active day)
        const activeDays = Math.min(tasksAssigned > 0 ? faker.number.int({ min: 1, max: 7 }) : 0, 7);
        const totalWorkingMinutes = activeDays * 8 * 60; // 8 hours per day

        // Calculate average completion time
        const avgCompletionHours = tasksCompleted > 0 
          ? faker.number.float({ min: 2, max: 16, fractionDigits: 1 })
          : 0;

        // Calculate rates
        const completionRate = tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) * 100 : 0;
        const onTimeDeliveryRate = tasksCompleted > 0 ? (tasksCompletedOnTime / tasksCompleted) * 100 : 0;
        
        // Calculate productivity score (composite of completion rate and on-time delivery)
        const productivityScore = tasksAssigned > 0 
          ? (completionRate * 0.6 + onTimeDeliveryRate * 0.4)
          : 0;

        try {
          const metric = await prisma.userPerformanceMetrics.create({
            data: {
              userId: teamMember.userId,
              teamMemberId: teamMember.id,
              period: periodConfig.type,
              periodStart: periodStart,
              periodEnd: periodEnd,
              tasksAssigned: tasksAssigned,
              tasksCompleted: tasksCompleted,
              tasksInProgress: tasksInProgress,
              tasksOverdue: tasksOverdue,
              totalWorkingMinutes: totalWorkingMinutes,
              averageTaskCompletionHours: avgCompletionHours,
              tasksCompletedOnTime: tasksCompletedOnTime,
              tasksCompletedLate: tasksCompletedLate,
              tasksReopened: faker.number.int({ min: 0, max: Math.floor(tasksCompleted * 0.1) }), // 10% max reopened
              lastActiveDate: tasksAssigned > 0 ? faker.date.between({ from: periodStart, to: periodEnd }) : null,
              activeDaysInPeriod: activeDays,
              completionRate: Math.round(completionRate * 100) / 100,
              onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
              productivityScore: Math.round(productivityScore * 100) / 100,
            },
          });

          metrics.push(metric);
        } catch (error) {
          // Metric might already exist (unique constraint), skip
        }
      }
    }

    console.log(`✅ Created performance metrics for user: ${teamMember.user.firstName} ${teamMember.user.lastName}`);
  }

  console.log(`✅ Created ${metrics.length} performance metrics entries`);
  return metrics;
}

export async function cleanPerformanceMetrics() {
  console.log('🧹 Cleaning performance metrics...');
  await prisma.userPerformanceMetrics.deleteMany();
  console.log('✅ Performance metrics cleaned');
}
