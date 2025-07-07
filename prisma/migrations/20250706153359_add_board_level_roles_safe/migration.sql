/*
  Warnings:

  - The values [EDITOR] on the enum `OrganizationRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `accessRole` on the `board_access` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BoardRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "GrantSource" AS ENUM ('DIRECT', 'TEAM', 'ORGANIZATION');

-- AlterEnum
BEGIN;
CREATE TYPE "OrganizationRole_new" AS ENUM ('ADMIN', 'MEMBER');
ALTER TABLE "invitations" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "organization_users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "organization_users" ALTER COLUMN "role" TYPE "OrganizationRole_new" USING ("role"::text::"OrganizationRole_new");
ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "OrganizationRole_new" USING ("role"::text::"OrganizationRole_new");
ALTER TYPE "OrganizationRole" RENAME TO "OrganizationRole_old";
ALTER TYPE "OrganizationRole_new" RENAME TO "OrganizationRole";
DROP TYPE "OrganizationRole_old";
ALTER TABLE "invitations" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
ALTER TABLE "organization_users" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;

-- AlterTable
ALTER TABLE "board_access" DROP COLUMN "accessRole",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "grantedBy" TEXT,
ADD COLUMN     "grantedVia" "GrantSource" NOT NULL DEFAULT 'DIRECT',
ADD COLUMN     "role" "BoardRole" NOT NULL DEFAULT 'VIEWER',
ADD COLUMN     "sourceTeamId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
