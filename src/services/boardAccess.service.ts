import prisma from "../config/prisma/prisma.client";

export const getBoardAccessList = async (boardId: string, excludeUserId?: string) => {
  const whereClause: any = { boardId };
  
  // Exclude the specified user if provided (typically the authenticated user)
  if (excludeUserId) {
    whereClause.userId = {
      not: excludeUserId
    };
  }

  return prisma.boardAccess.findMany({
    where: whereClause,
    include: {
      user: {
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
};
