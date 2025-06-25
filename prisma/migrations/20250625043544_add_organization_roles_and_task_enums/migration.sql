/*
  Warnings:

  - The `role` column on the `organization_users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `priority` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `organization_users` table without a default value. This is not possible if the table is not empty.
  - Made the column `order` on table `tasks` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('ADMIN', 'EDITOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST');

-- AlterTable
ALTER TABLE "organization_users" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "customStatus" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
DROP COLUMN "priority",
ADD COLUMN     "priority" "TaskPriority" DEFAULT 'MEDIUM',
ALTER COLUMN "order" SET NOT NULL,
ALTER COLUMN "order" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user_"("id") ON DELETE SET NULL ON UPDATE CASCADE;
