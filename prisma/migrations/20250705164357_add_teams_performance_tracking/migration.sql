/*
  Warnings:

  - Added the required column `organizationId` to the `teams` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('LEADER', 'MEMBER');

-- CreateEnum
CREATE TYPE "PerformancePeriod" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY');

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#3B82F6',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "leaderId" TEXT,
ADD COLUMN     "objectives" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_board_access" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT NOT NULL,

    CONSTRAINT "team_board_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_performance_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "period" "PerformancePeriod" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "tasksAssigned" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "tasksInProgress" INTEGER NOT NULL DEFAULT 0,
    "tasksOverdue" INTEGER NOT NULL DEFAULT 0,
    "totalWorkingMinutes" INTEGER NOT NULL DEFAULT 0,
    "averageTaskCompletionHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tasksCompletedOnTime" INTEGER NOT NULL DEFAULT 0,
    "tasksCompletedLate" INTEGER NOT NULL DEFAULT 0,
    "tasksReopened" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "activeDaysInPeriod" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onTimeDeliveryRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "productivityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_activity_logs" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "timeSpent" INTEGER,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_board_access_teamId_boardId_key" ON "team_board_access"("teamId", "boardId");

-- CreateIndex
CREATE INDEX "user_performance_metrics_teamMemberId_period_idx" ON "user_performance_metrics"("teamMemberId", "period");

-- CreateIndex
CREATE INDEX "user_performance_metrics_userId_period_idx" ON "user_performance_metrics"("userId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "user_performance_metrics_userId_teamMemberId_period_periodS_key" ON "user_performance_metrics"("userId", "teamMemberId", "period", "periodStart");

-- CreateIndex
CREATE INDEX "task_activity_logs_taskId_idx" ON "task_activity_logs"("taskId");

-- CreateIndex
CREATE INDEX "task_activity_logs_userId_idx" ON "task_activity_logs"("userId");

-- CreateIndex
CREATE INDEX "task_activity_logs_timestamp_idx" ON "task_activity_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "user_"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_board_access" ADD CONSTRAINT "team_board_access_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_board_access" ADD CONSTRAINT "team_board_access_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_performance_metrics" ADD CONSTRAINT "user_performance_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_performance_metrics" ADD CONSTRAINT "user_performance_metrics_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "team_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_activity_logs" ADD CONSTRAINT "task_activity_logs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_activity_logs" ADD CONSTRAINT "task_activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
