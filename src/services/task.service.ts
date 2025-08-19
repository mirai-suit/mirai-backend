// Reorder tasks in a column
import { io } from "../server"; // Adjust path if needed

export const reorderTasksInColumn = async (
  columnId: string,
  taskIds: string[]
) => {
  try {
    // Fetch all tasks in the column
    const tasks = await prisma.task.findMany({
      where: { columnId, deletedAt: null },
      select: { id: true },
    });
    // Validate all provided IDs exist in the column
    const validIds = new Set(tasks.map((t) => t.id));
    if (taskIds.some((id) => !validIds.has(id))) {
      throw new CustomError(
        400,
        "One or more task IDs are invalid for this column"
      );
    }
    // Update order for each task
    const updates = taskIds.map((id, idx) =>
      prisma.task.update({
        where: { id },
        data: { order: idx },
      })
    );
    await Promise.all(updates);
    // Return updated tasks (ordered)
    const updatedTasks = await prisma.task.findMany({
      where: { columnId, deletedAt: null },
      include: {
        assignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return {
      success: true,
      message: "Tasks reordered successfully",
      tasks: updatedTasks.map(transformTaskToDto),
    };
  } catch (error) {
    logger.error(`Reorder Tasks Service Error: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to reorder tasks");
  }
};
import prisma from "../config/prisma/prisma.client";
import CustomError from "../shared/exceptions/CustomError";
import logger from "../utils/logger";
import { PerformanceService } from "./performance.service";
import {
  TaskResponseDto,
  TaskDetailResponseDto,
  TaskAssigneeDto,
} from "../interfaces/DTOs/task/response.dto";
import {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
} from "../schemas/task.schema";
import {
  generateTaskAssignmentEmailTemplate,
  generateTaskAssignmentEmailPlainText,
} from "../templates/email/task-assignment.template";
import { sendEmail } from "./email.service";
import { createNotification } from "./notification.service";

// Helper function to transform Prisma task to minimal DTO
const transformTaskToDto = (task: any): TaskResponseDto => {
  return {
    id: task.id,
    title: task.title,
    description: task.description || undefined,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
    priority: task.priority || undefined,
    order: task.order || 0,
    isRecurring: task.isRecurring,
    boardId: task.boardId,
    columnId: task.columnId,
    teamId: task.teamId || undefined,
    assignees:
      task.assignees?.map(
        (assignee: any): TaskAssigneeDto => ({
          id: assignee.id,
          firstName: assignee.firstName,
          lastName: assignee.lastName,
          email: assignee.email,
          avatar: assignee.avatar || undefined,
        })
      ) || [],
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    deletedAt: task.deletedAt ? task.deletedAt.toISOString() : undefined,
  };
};

// Helper function to transform Prisma task to detailed DTO (with relations)
const transformTaskToDetailDto = async (
  task: any
): Promise<TaskDetailResponseDto> => {
  const baseTask = transformTaskToDto(task);

  // Generate signed URLs for attachments
  const attachmentsWithSignedUrls = task.attachments
    ? await Promise.all(
        task.attachments.map(async (attachment: any) => {
          try {
            // Generate signed URL for secure access
            const signedUrl = await require("./s3Upload.service").getSignedUrl(
              attachment.s3Key,
              3600 // 1 hour expiry
            );

            return {
              id: attachment.id,
              filename: attachment.filename,
              fileSize: attachment.fileSize,
              mimeType: attachment.mimeType,
              fileType: attachment.fileType,
              s3Key: attachment.s3Key,
              downloadUrl: signedUrl,
              uploadedBy: {
                id: attachment.uploader.id,
                firstName: attachment.uploader.firstName,
                lastName: attachment.uploader.lastName,
                avatar: attachment.uploader.avatar,
              },
              createdAt: attachment.createdAt.toISOString(),
            };
          } catch (error) {
            logger.error(
              `Failed to generate signed URL for attachment ${attachment.id}: ${error}`
            );
            // Return attachment without downloadUrl if signed URL generation fails
            return {
              id: attachment.id,
              filename: attachment.filename,
              fileSize: attachment.fileSize,
              mimeType: attachment.mimeType,
              fileType: attachment.fileType,
              s3Key: attachment.s3Key,
              downloadUrl: attachment.s3Url, // Fallback to stored URL
              uploadedBy: {
                id: attachment.uploader.id,
                firstName: attachment.uploader.firstName,
                lastName: attachment.uploader.lastName,
                avatar: attachment.uploader.avatar,
              },
              createdAt: attachment.createdAt.toISOString(),
            };
          }
        })
      )
    : [];

  return {
    ...baseTask,
    column: task.column
      ? {
          id: task.column.id,
          name: task.column.name,
          color: task.column.color,
          order: task.column.order,
        }
      : undefined,
    board: task.board
      ? {
          id: task.board.id,
          title: task.board.title,
          color: task.board.color,
          organizationId: task.board.organizationId,
        }
      : undefined,
    team: task.team
      ? {
          id: task.team.id,
          name: task.team.name,
        }
      : undefined,
    attachments: attachmentsWithSignedUrls,
  } as TaskDetailResponseDto;
};

// Create a new task
export const createTask = async (
  data: CreateTaskInput,
  assignerId?: string
) => {
  try {
    // Verify column exists and belongs to board
    const column = await prisma.column.findFirst({
      where: {
        id: data.columnId,
        boardId: data.boardId,
      },
    });

    if (!column) {
      throw new CustomError(400, "Invalid column or board ID");
    }

    // If assignees provided, verify they exist
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: data.assigneeIds } },
      });

      if (users.length !== data.assigneeIds.length) {
        throw new CustomError(400, "One or more assignee IDs are invalid");
      }
    }

    // Parse dueDate if provided
    const taskData = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    };

    // Create task with assignees
    const task = await prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        order: taskData.order,
        isRecurring: taskData.isRecurring,
        boardId: taskData.boardId,
        columnId: taskData.columnId,
        teamId: taskData.teamId,
        assignees: taskData.assigneeIds
          ? {
              connect: taskData.assigneeIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        assignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        column: {
          select: {
            id: true,
            name: true,
            color: true,
            order: true,
          },
        },
        board: {
          select: {
            id: true,
            title: true,
            color: true,
            organizationId: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Send email notifications to assignees
    if (task.assignees && task.assignees.length > 0) {
      try {
        // Get the organization details
        const organization = await prisma.organization.findUnique({
          where: { id: task.board.organizationId },
          select: { name: true },
        });

        // Get the assigner details
        let assignerName = "Project Manager";
        if (assignerId) {
          const assigner = await prisma.user.findUnique({
            where: { id: assignerId },
            select: { firstName: true, lastName: true },
          });
          if (assigner) {
            assignerName = `${assigner.firstName} ${assigner.lastName}`;
          }
        }

        // Send email to each assignee
        for (const assignee of task.assignees) {
          const taskUrl = `${process.env.FRONTEND_URL}/u/dashboard/o/${task.board.organizationId}/b/${task.boardId}/t/${task.id}`;

          const emailHtml = generateTaskAssignmentEmailTemplate({
            taskTitle: task.title,
            taskDescription: task.description || undefined,
            assignerName,
            assigneeName: `${assignee.firstName} ${assignee.lastName}`,
            organizationName: organization?.name || "Unknown Organization",
            boardTitle: task.board.title,
            columnName: task.column.name,
            dueDate: task.dueDate?.toISOString(),
            priority: task.priority || undefined,
            taskUrl,
          });

          const emailText = generateTaskAssignmentEmailPlainText({
            taskTitle: task.title,
            taskDescription: task.description || undefined,
            assignerName,
            assigneeName: `${assignee.firstName} ${assignee.lastName}`,
            organizationName: organization?.name || "Unknown Organization",
            boardTitle: task.board.title,
            columnName: task.column.name,
            dueDate: task.dueDate?.toISOString(),
            priority: task.priority || undefined,
            taskUrl,
          });

           const notification = await createNotification({
            userId: assignee.id,
            notification: `You have been assigned to task: ${task.title}`,
          });

           io.emit("dispatchNotification", {...notification});

          

          await sendEmail(
            {
              to: assignee.email,
              subject: `New Task Assignment: ${task.title}`,
            },
            {
              html: emailHtml,
              text: emailText,
            }
          );

          logger.info(
            `Task assignment email sent to ${assignee.email} for task ${task.id}`
          );
        }
      } catch (emailError) {
        logger.error(`Failed to send task assignment emails: ${emailError}`);
        // Don't fail the task creation if email sending fails
      }
    }

    // Track performance metrics for task creation
    if (task.assignees && task.assignees.length > 0) {
      console.log(`🆕 [TASK CREATE] Tracking performance for new task ${task.id} with ${task.assignees.length} assignees`);
      const performanceService = new PerformanceService(prisma);
      
      // Track task creation for all assignees
      for (const assignee of task.assignees) {
        try {
          console.log(`📊 [TASK CREATE] Calling trackTaskActivity for assignee: ${assignee.id} (${assignee.firstName} ${assignee.lastName})`);
          await performanceService.trackTaskActivity({
            taskId: task.id,
            userId: assignee.id,
            action: "created",
            fromStatus: undefined,
            toStatus: task.status,
            timeSpent: 0,
            notes: `Task created and assigned`,
          });
          console.log(`✅ [TASK CREATE] Performance tracking completed for assignee ${assignee.id}`);
        } catch (performanceError) {
          console.error(`❌ [TASK CREATE] Performance tracking error: ${performanceError}`);
          logger.error(`Performance tracking error: ${performanceError}`);
          // Don't fail the task creation if performance tracking fails
        }
      }
    } else {
      console.log(`📝 [TASK CREATE] No assignees found for task ${task.id}, skipping performance tracking`);
    }

    return {
      success: true,
      message: "Task created successfully",
      task: await transformTaskToDetailDto(task),
    };
  } catch (error) {
    logger.error(`Create Task Service Error: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to create task");
  }
};

// Get a task by ID
export const getTaskById = async (taskId: string) => {
  try {
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        deletedAt: null, // Only get non-deleted tasks
      },
      include: {
        assignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        column: {
          select: {
            id: true,
            name: true,
            color: true,
            order: true,
          },
        },
        board: {
          select: {
            id: true,
            title: true,
            color: true,
            organizationId: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: {
          include: {
            uploader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!task) {
      throw new CustomError(404, "Task not found");
    }

    return {
      success: true,
      task: await transformTaskToDetailDto(task),
    };
  } catch (error) {
    logger.error(`Get Task Service Error: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to fetch task");
  }
};

// Get all tasks for a board
export const getTasksForBoard = async (boardId: string) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        boardId,
        deletedAt: null,
      },
      include: {
        assignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ columnId: "asc" }, { order: "asc" }, { createdAt: "asc" }],
    });

    return {
      success: true,
      tasks: tasks.map(transformTaskToDto),
    };
  } catch (error) {
    logger.error(`Get Board Tasks Service Error: ${error}`);
    throw new CustomError(500, "Failed to fetch board tasks");
  }
};

// Get all tasks for a column
export const getTasksForColumn = async (columnId: string) => {
  try {
    let tasks = await prisma.task.findMany({
      where: {
        columnId,
        deletedAt: null,
      },
      include: {
        assignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // If all tasks have order 0 (or some have order 0), sort by createdAt for those
    if (tasks.some((t) => t.order === 0)) {
      // Sort: tasks with order > 0 first (by order asc), then order 0 by createdAt asc
      tasks = [
        ...tasks.filter((t) => t.order > 0).sort((a, b) => a.order - b.order),
        ...tasks
          .filter((t) => t.order === 0)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      ];
    } else {
      // All have order > 0, sort by order asc, then createdAt asc
      tasks = tasks.sort(
        (a, b) =>
          a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime()
      );
    }

    return {
      success: true,
      tasks: tasks.map(transformTaskToDto),
    };
  } catch (error) {
    logger.error(`Get Column Tasks Service Error: ${error}`);
    throw new CustomError(500, "Failed to fetch column tasks");
  }
};

// Update a task
export const updateTask = async (taskId: string, data: UpdateTaskInput) => {
  try {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: {
        id: taskId,
        deletedAt: null,
      },
    });

    if (!existingTask) {
      throw new CustomError(404, "Task not found");
    }

    // If columnId is being updated, verify it exists and belongs to same board
    if (data.columnId && data.columnId !== existingTask.columnId) {
      const column = await prisma.column.findFirst({
        where: {
          id: data.columnId,
          boardId: existingTask.boardId,
        },
      });

      if (!column) {
        throw new CustomError(400, "Invalid column ID for this board");
      }
    }

    // If assignees provided, verify they exist
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: data.assigneeIds } },
      });

      if (users.length !== data.assigneeIds.length) {
        throw new CustomError(400, "One or more assignee IDs are invalid");
      }
    }

    // Parse dueDate if provided
    const updateData = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate,
    };

    // Update task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: updateData.title,
        description: updateData.description,
        status: updateData.status,
        dueDate: updateData.dueDate,
        priority: updateData.priority,
        order: updateData.order,
        isRecurring: updateData.isRecurring,
        columnId: updateData.columnId,
        teamId: updateData.teamId,
        assignees: updateData.assigneeIds
          ? {
              set: updateData.assigneeIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        assignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        column: {
          select: {
            id: true,
            name: true,
            color: true,
            order: true,
          },
        },
        board: {
          select: {
            id: true,
            title: true,
            color: true,
            organizationId: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Track performance metrics if status changed
    if (data.status && data.status !== existingTask.status) {
      console.log(`🔄 [TASK UPDATE] Status changed from ${existingTask.status} to ${data.status} for task ${taskId}`);
      const performanceService = new PerformanceService(prisma);

      // Track activity for all assignees
      console.log(`👥 [TASK UPDATE] Tracking performance for ${task.assignees.length} assignees`);
      for (const assignee of task.assignees) {
        let action: string;

        // Determine action based on status change
        if (data.status === "COMPLETED") {
          action = "completed";
        } else if (
          data.status === "IN_PROGRESS" &&
          existingTask.status === "NOT_STARTED"
        ) {
          action = "started";
        } else if (
          data.status === "IN_PROGRESS" &&
          existingTask.status === "COMPLETED"
        ) {
          action = "reopened"; // Task moved back from completed to in progress
        } else if (
          data.status === "NOT_STARTED" &&
          existingTask.status === "IN_PROGRESS"
        ) {
          action = "updated"; // Use 'updated' for now, we'll handle it in performance service
        } else {
          action = "updated";
        }

        console.log(`🎯 [TASK UPDATE] Action determined: ${action} for user ${assignee.id} (${assignee.firstName} ${assignee.lastName})`);

        // Only track specific actions that affect metrics
        if (["completed", "started", "reopened"].includes(action)) {
          try {
            console.log(`📊 [TASK UPDATE] Calling trackTaskActivity for action: ${action}`);
            await performanceService.trackTaskActivity({
              taskId: task.id,
              userId: assignee.id,
              action: action as "completed" | "started" | "created" | "reopened",
              fromStatus: existingTask.status,
              toStatus: data.status,
              timeSpent: 0, // Will be calculated by completion time tracking
              notes: `Task status changed from ${existingTask.status} to ${data.status}`,
            });
            console.log(`✅ [TASK UPDATE] Performance tracking completed for user ${assignee.id}`);
          } catch (performanceError) {
            console.error(`❌ [TASK UPDATE] Performance tracking error: ${performanceError}`);
            logger.error(`Performance tracking error: ${performanceError}`);
            // Don't fail the task update if performance tracking fails
          }
        } else {
          console.log(`⏭️ [TASK UPDATE] Skipping performance tracking for action: ${action}`);
        }
      }
    } else {
      console.log(`📝 [TASK UPDATE] No status change detected (${existingTask.status} -> ${data.status})`);
    }

    updateData.assigneeIds?.forEach(async (assigneeId) => {
    const notification = await createNotification({
            userId: assigneeId,
            notification: `You have been assigned to task: ${task.title} in board: ${task.board.title}`,
    });

    io.emit("dispatchNotification", {...notification});
    })
    return {
      success: true,
      message: "Task updated successfully",
      task: await transformTaskToDetailDto(task),
    };
  } catch (error) {
    logger.error(`Update Task Service Error: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to update task");
  }
};

// Soft delete a task
export const deleteTask = async (taskId: string) => {
  try {
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        deletedAt: null,
      },
    });

    if (!task) {
      throw new CustomError(404, "Task not found");
    }

    const deletedTask = await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });

    return {
      success: true,
      message: "Task deleted successfully",
      task: {
        id: deletedTask.id,
        deletedAt: deletedTask.deletedAt!.toISOString(),
      },
    };
  } catch (error) {
    logger.error(`Delete Task Service Error: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to delete task");
  }
};

// Assign users to a task
export const assignUsersToTask = async (taskId: string, userIds: string[]) => {
  try {
    // Check if task exists
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        deletedAt: null,
      },
    });

    if (!task) {
      throw new CustomError(404, "Task not found");
    }

    // Verify all users exist
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    if (users.length !== userIds.length) {
      throw new CustomError(400, "One or more user IDs are invalid");
    }

    // Update task with new assignees
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignees: {
          set: userIds.map((id) => ({ id })),
        },
      },
      include: {
        assignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        column: {
          select: {
            id: true,
            name: true,
            color: true,
            order: true,
          },
        },
        board: {
          select: {
            id: true,
            title: true,
            color: true,
            organizationId: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: "Users assigned successfully",
      task: await transformTaskToDetailDto(updatedTask),
    };
  } catch (error) {
    logger.error(`Assign Users Service Error: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to assign users to task");
  }
};

// Move a task between columns (for drag & drop)
export const moveTask = async (data: MoveTaskInput & { taskId: string }) => {
  try {
    const { taskId, sourceColumnId, targetColumnId, newOrder } = data;

    // Check if task exists and is in the source column
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        columnId: sourceColumnId,
        deletedAt: null,
      },
    });

    if (!task) {
      throw new CustomError(404, "Task not found in source column");
    }

    // Verify target column exists and belongs to same board
    const targetColumn = await prisma.column.findFirst({
      where: {
        id: targetColumnId,
        boardId: task.boardId,
      },
    });

    if (!targetColumn) {
      throw new CustomError(400, "Invalid target column for this board");
    }

    // Update task's column and order
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: targetColumnId,
        order: newOrder,
      },
      include: {
        assignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        column: {
          select: {
            id: true,
            name: true,
            color: true,
            order: true,
          },
        },
        board: {
          select: {
            id: true,
            title: true,
            color: true,
            organizationId: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: "Task moved successfully",
      task: await transformTaskToDetailDto(updatedTask),
    };
  } catch (error) {
    logger.error(`Move Task Service Error: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to move task");
  }
};
